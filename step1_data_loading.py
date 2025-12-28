import pandas as pd

# 1. Thu thập dữ liệu [cite: 9, 15]
def load_data():
    # Đọc 2 file csv
    try:
        credits = pd.read_csv("tmdb_5000_credits.csv")
        movies = pd.read_csv("tmdb_5000_movies.csv")
        
        # Gộp dữ liệu dựa trên ID phim (đổi tên cột cho khớp)
        credits.columns = ['id','tittle','cast','crew']
        movies = movies.merge(credits, on='id')
        
        print("✅ Tải dữ liệu thành công!")
        return movies
    except FileNotFoundError:
        print("❌ Lỗi: Không tìm thấy file csv. Hãy chắc chắn bạn đã tải file về thư mục code.")
        return None

# Chạy thử
df = load_data()

if df is not None:
    # 2. Kiểm tra các tiêu chí đề bài 
    print("-" * 30)
    print(f"Tổng số lượng phim (Items): {df.shape[0]} (Yêu cầu >= 2000)")
    print(f"Số lượng thuộc tính (Features): {df.shape[1]} (Yêu cầu >= 5)")
    print("-" * 30)
    
    # Hiển thị 5 dòng đầu để xem dữ liệu
    print("Các cột dữ liệu quan trọng:")
    print(df[['original_title', 'genres', 'vote_average', 'overview']].head())
    
    # Lưu lại file sạch hơn để dùng cho bước sau
    # Chúng ta chỉ giữ lại các cột cần thiết cho hệ thống gợi ý
    features_to_keep = ['id', 'original_title', 'overview', 'genres', 'keywords', 'cast', 'crew', 'vote_average', 'vote_count']
    df_clean = df[features_to_keep]
    df_clean.to_csv('movies_processed.csv', index=False)
    print("\n✅ Đã lưu file rút gọn 'movies_processed.csv' để dùng cho bước tiếp theo.")