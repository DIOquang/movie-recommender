import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from ast import literal_eval
from wordcloud import WordCloud
from sklearn.preprocessing import MinMaxScaler
import numpy as np

# 1. Load lại dữ liệu từ bước 1
df = pd.read_csv('movies_processed.csv')

# ======================================================
# PHẦN A: LÀM SẠCH DỮ LIỆU (DATA CLEANING)
# ======================================================

print("--- ĐANG XỬ LÝ DỮ LIỆU ---")

# Hàm chuyển đổi JSON string thành list tên (VD: "[{name: Action}]" -> ["Action"])
def convert_json_to_list(text):
    try:
        L = []
        # literal_eval giúp chuyển chuỗi string thành cấu trúc list/dict thật
        for i in literal_eval(text):
            L.append(i['name'])
        return L
    except:
        return []

# Áp dụng cho các cột bị dính JSON
json_columns = ['genres', 'keywords']
for col in json_columns:
    df[col] = df[col].apply(convert_json_to_list)

print("✅ Đã tách từ khóa khỏi JSON.")

# Xử lý Missing Values (Giá trị bị thiếu)
# Kiểm tra xem cột 'overview' có bị null không
missing_count = df['overview'].isnull().sum()
print(f"Số lượng phim thiếu mô tả (Overview): {missing_count}")

# Lấp đầy giá trị thiếu bằng chuỗi rỗng để không bị lỗi code sau này
df['overview'] = df['overview'].fillna('')

# ======================================================
# XỬ LÝ OUTLIERS (Giá trị bất thường)
# ======================================================
print("\n--- XỬ LÝ OUTLIERS ---")
print(f"Trước xử lý: {len(df)} phim")

# Phương pháp IQR (Interquartile Range) cho vote_average
Q1 = df['vote_average'].quantile(0.25)
Q3 = df['vote_average'].quantile(0.75)
IQR = Q3 - Q1
lower_bound = Q1 - 1.5 * IQR
upper_bound = Q3 + 1.5 * IQR

# Lọc bỏ outliers
df = df[(df['vote_average'] >= lower_bound) & (df['vote_average'] <= upper_bound)]
print(f"Sau xử lý outliers: {len(df)} phim (Đã loại bỏ {5000 - len(df)} phim)")

# ======================================================
# CHUẨN HÓA DỮ LIỆU (NORMALIZATION)
# ======================================================
print("\n--- CHUẨN HÓA DỮ LIỆU ---")
scaler = MinMaxScaler(feature_range=(0, 1))
df['vote_average_normalized'] = scaler.fit_transform(df[['vote_average']])
df['vote_count_normalized'] = scaler.fit_transform(df[['vote_count']])
print(f"✅ Đã chuẩn hóa vote_average và vote_count về khoảng [0, 1]")

# ======================================================
# PHẦN B: TRỰC QUAN HÓA (EDA - Exploratory Data Analysis)
# ======================================================

print("\n--- ĐANG VẼ BIỂU ĐỒ (Dùng cho báo cáo) ---")

# BIỂU ĐỒ 1: Phân bố điểm đánh giá (Rating Distribution)
plt.figure(figsize=(10, 6))
sns.histplot(df['vote_average'], bins=30, kde=True, color='blue')
plt.title('Phân bố điểm đánh giá trung bình (Vote Average)')
plt.xlabel('Điểm (0-10)')
plt.ylabel('Số lượng phim')
plt.savefig('chart_rating_distribution.png') # Lưu ảnh để nộp báo cáo
print("📊 Đã lưu biểu đồ 1: chart_rating_distribution.png")

# BIỂU ĐỒ 2: Top các thể loại phim phổ biến
# Mở rộng list genres ra thành từng dòng để đếm
genres_list = df.explode('genres')
top_genres = genres_list['genres'].value_counts().head(10)

plt.figure(figsize=(12, 6))
sns.barplot(x=top_genres.values, y=top_genres.index, palette='viridis')
plt.title('Top 10 Thể loại phim phổ biến nhất')
plt.xlabel('Số lượng phim')
plt.savefig('chart_top_genres.png')
print("📊 Đã lưu biểu đồ 2: chart_top_genres.png")

# BIỂU ĐỒ 3: WordCloud (Đám mây từ khóa trong tên phim)
text = " ".join(title for title in df['original_title'])
wordcloud = WordCloud(width=800, height=400, background_color='white').generate(text)

plt.figure(figsize=(10, 5))
plt.imshow(wordcloud, interpolation='bilinear')
plt.axis("off")
plt.title('WordCloud: Các từ phổ biến trong tên phim')
plt.savefig('chart_wordcloud.png')
print("📊 Đã lưu biểu đồ 3: chart_wordcloud.png")

# ======================================================
# LƯU FILE SẠCH CUỐI CÙNG
# ======================================================
# Chuyển list genres/keywords về lại string để lưu CSV không bị lỗi format
# (Lưu ý: Khi load lên lại cần eval lại nếu muốn dùng list)
df.to_csv('movies_clean.csv', index=False)
print("\n✅ HOÀN TẤT! Đã lưu file 'movies_clean.csv' đã làm sạch.")