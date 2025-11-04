import csv
import json

# Mood mapping based on genres
GENRE_MOOD_MAP = {
    "Action": ["Excited", "Adventurous", "Energetic"],
    "Adventure": ["Adventurous", "Excited", "Curious"],
    "Animation": ["Happy", "Joyful", "Cheerful"],
    "Comedy": ["Happy", "Joyful", "Cheerful"],
    "Crime": ["Tense", "Mysterious", "Dark"],
    "Documentary": ["Thoughtful", "Curious", "Inspired"],
    "Drama": ["Emotional", "Thoughtful", "Intense"],
    "Family": ["Happy", "Warm", "Joyful"],
    "Fantasy": ["Magical", "Adventurous", "Curious"],
    "History": ["Thoughtful", "Inspired", "Reflective"],
    "Horror": ["Scared", "Tense", "Thrilling"],
    "Music": ["Joyful", "Energetic", "Inspired"],
    "Mystery": ["Mysterious", "Curious", "Tense"],
    "Romance": ["Romantic", "Emotional", "Warm"],
    "Science Fiction": ["Curious", "Excited", "Adventurous"],
    "Thriller": ["Tense", "Excited", "Thrilling"],
    "War": ["Intense", "Emotional", "Thoughtful"],
    "Western": ["Adventurous", "Intense", "Bold"]
}

def get_moods_from_genres(genres):
    """Extract moods from genres"""
    moods = set()
    for genre in genres:
        if genre in GENRE_MOOD_MAP:
            moods.update(GENRE_MOOD_MAP[genre])
    return list(moods) if moods else ["Neutral"]

movies = []

with open("movies.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader, start=1):
        try:
            # Clean and safely parse release year
            release_date = row.get("Release_Date", "").strip()
            release_year = int(release_date.split("-")[0]) if release_date and release_date[0].isdigit() else None

            # Parse genres
            genres = [g.strip() for g in (row.get("Genre") or "").split(",") if g.strip()]
            
            # Get moods based on genres
            moods = get_moods_from_genres(genres)

            movie = {
                "id": i,
                "title": row.get("Title", "").strip(),
                "genre": genres,
                "mood": moods,
                "overview": row.get("Overview", "").strip(),
                "releaseYear": release_year,
                "posterUrl": row.get("Poster_Url", "").strip(),
                "rating": float(row["Vote_Average"]) if row.get("Vote_Average") else None,
                "popularity": float(row.get("Popularity", 0)) if row.get("Popularity") else 0,
                "voteCount": int(row.get("Vote_Count", 0)) if row.get("Vote_Count") else 0
            }

            movies.append(movie)

        except Exception as e:
            print(f"⚠️ Skipped row {i} due to error: {e}")

# Save JSON
with open("movies_real.json", "w", encoding="utf-8") as f:
    json.dump(movies, f, indent=2, ensure_ascii=False)

print(f"✅ movies_real.json created successfully with {len(movies)} entries!")
print(f"📊 Sample moods: {set([m for movie in movies[:10] for m in movie['mood']])}")
