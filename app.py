import os
import sys
import time
import signal
import subprocess
import webbrowser
from pathlib import Path

try:
    import requests
except Exception:
    requests = None


ROOT = Path(__file__).parent.resolve()
BACKEND_PORT = int(os.getenv("PORT", "5001"))
HEALTH_URL = f"http://localhost:{BACKEND_PORT}/api/health"


def ensure_env():
    """Create a local virtualenv and install requirements if missing."""
    venv_dir = ROOT / ".venv"
    venv_bin = venv_dir / "bin"
    # Create venv if not exists
    if not venv_dir.exists():
        print("Creating virtual environment (.venv)...")
        subprocess.check_call([sys.executable, "-m", "venv", str(venv_dir)])

    # Install requirements
    pip_path = str(venv_bin / "pip")
    req_path = ROOT / "requirements.txt"
    if req_path.exists():
        print("Installing dependencies...")
        subprocess.check_call([pip_path, "install", "--upgrade", "pip"])
        subprocess.check_call([pip_path, "install", "-r", str(req_path)])


def which(cmd: str) -> bool:
    return subprocess.call(["which", cmd], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0


def kill_port_process(port: int) -> None:
    """Kill any process listening on the given port."""
    try:
        # Use lsof to find process on port
        result = subprocess.run(
            ["lsof", "-i", f":{port}", "-t"],
            capture_output=True,
            text=True,
            timeout=3
        )
        pids = result.stdout.strip().split('\n')
        pids = [p.strip() for p in pids if p.strip()]
        for pid in pids:
            try:
                print(f"Killing stale process {pid} on port {port}...")
                subprocess.run(["kill", "-9", pid], timeout=3)
            except Exception as e:
                print(f"Could not kill PID {pid}: {e}")
    except Exception:
        # lsof not available or other error; skip
        pass


def start_backend() -> subprocess.Popen:
    # Clean up stale process on target port
    kill_port_process(BACKEND_PORT)
    env = os.environ.copy()
    env.setdefault("TMDB_API_KEY", "973eac1c6ee5c0af02fd6281ff2bb30b")

    venv_bin = ROOT / ".venv" / "bin"
    venv_python = str(venv_bin / "python") if (venv_bin / "python").exists() else sys.executable
    venv_gunicorn = str(venv_bin / "gunicorn") if (venv_bin / "gunicorn").exists() else None

    if venv_gunicorn:
        cmd = [venv_gunicorn, "-w", "1", "-b", f"0.0.0.0:{BACKEND_PORT}", "api:app"]
    elif which("gunicorn"):
        cmd = ["gunicorn", "-w", "1", "-b", f"0.0.0.0:{BACKEND_PORT}", "api:app"]
    else:
        # Fallback to Flask's built-in server
        cmd = [venv_python, str(ROOT / "api.py")]

    print(f"Starting backend on port {BACKEND_PORT}...")
    return subprocess.Popen(cmd, cwd=str(ROOT), env=env)


def wait_for_health(timeout: int = 90) -> bool:
    if requests is None:
        print("requests not available; skipping health check")
        time.sleep(5)
        return True

    print(f"Waiting for API health at {HEALTH_URL}...")
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(HEALTH_URL, timeout=3)
            if r.status_code == 200:
                print("API is healthy.")
                return True
        except Exception:
            pass
        time.sleep(1.5)
    print("Timed out waiting for API health.")
    return False


def start_frontend_server(port: int = 8000) -> subprocess.Popen:
    print(f"Starting static server on http://localhost:{port} ...")
    venv_bin = ROOT / ".venv" / "bin"
    venv_python = str(venv_bin / "python") if (venv_bin / "python").exists() else sys.executable
    cmd = [venv_python, "-m", "http.server", str(port)]
    return subprocess.Popen(cmd, cwd=str(ROOT))


def open_frontend(use_server: bool = True, port: int = 8000):
    if use_server:
        url = f"http://localhost:{port}"
    else:
        url = (ROOT / "index.html").as_uri()
    print(f"Opening frontend: {url}")
    webbrowser.open(url, new=2)


def main():
    # Ensure local venv and dependencies
    ensure_env()
    use_server = True  # serve frontend to avoid file:// CORS quirks
    server_port = int(os.getenv("FRONTEND_PORT", "8000"))

    # Always try to clean up stale process first (in case previous run hung)
    kill_port_process(BACKEND_PORT)
    time.sleep(0.5)

    # Quick health check; if not healthy, start backend and wait longer
    pre_healthy = wait_for_health(timeout=2)
    backend = None
    if not pre_healthy:
        backend = start_backend()
        # Give backend time to fully load TF-IDF model (~10-15s)
        healthy = wait_for_health(timeout=120)
    else:
        healthy = True
        print("Backend already running; skipping start.")

    frontend = None
    try:
        if use_server:
            frontend = start_frontend_server(server_port)
        open_frontend(use_server=use_server, port=server_port)

        # Frontend has fallback demo if backend isn't ready yet
        if not healthy:
            print("⚠️  Backend is starting (loading model...); frontend will auto-switch to live when ready.")
        else:
            print("✅ Backend is ready; open frontend to use live TF-IDF recommendations.")

        # Keep the launcher alive to allow Ctrl+C to stop child processes
        print("Press Ctrl+C to stop.")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        for proc in (frontend, backend):
            if proc and proc.poll() is None:
                try:
                    proc.send_signal(signal.SIGINT)
                    time.sleep(0.5)
                    proc.terminate()
                except Exception:
                    pass


if __name__ == "__main__":
    main()
