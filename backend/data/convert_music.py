import csv
import json
from collections import defaultdict

# Cover images pool for different genres
COVER_IMAGES = [
    "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/257904/pexels-photo-257904.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/712970/pexels-photo-712970.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400"
]

def format_duration(duration_ms):
    """Convert duration from milliseconds to MM:SS format"""
    if not duration_ms:
        return "3:00"
    total_seconds = int(duration_ms) // 1000
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    return f"{minutes}:{seconds:02d}"

songs = []
artist_stats = defaultdict(int)

with open("music_dataset.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader, start=1):
        try:
            # Parse artist
            artist = row.get("artists", "").strip()
            if not artist:
                continue
                
            # Take first artist if multiple
            if ";" in artist:
                artist = artist.split(";")[0].strip()
            
            artist_stats[artist] += 1
            
            # Parse genre
            genre = row.get("track_genre", "pop").strip().title()
            
            # Get duration
            duration = format_duration(row.get("duration_ms"))
            
            # Assign cover image based on index
            cover_url = COVER_IMAGES[i % len(COVER_IMAGES)]
            
            song = {
                "id": i,
                "title": row.get("track_name", "").strip(),
                "artist": artist,
                "genre": genre,
                "album": row.get("album_name", "Unknown Album").strip(),
                "coverUrl": cover_url,
                "duration": duration,
                "popularity": int(float(row.get("popularity", 0))),
                "danceability": float(row.get("danceability", 0.5)),
                "energy": float(row.get("energy", 0.5)),
                "valence": float(row.get("valence", 0.5)),
                "tempo": float(row.get("tempo", 120.0))
            }

            songs.append(song)

        except Exception as e:
            print(f"⚠️ Skipped row {i} due to error: {e}")

# Save JSON
with open("music_real.json", "w", encoding="utf-8") as f:
    json.dump(songs, f, indent=2, ensure_ascii=False)

# Print statistics
top_artists = sorted(artist_stats.items(), key=lambda x: x[1], reverse=True)[:10]
print(f"✅ music_real.json created successfully with {len(songs)} entries!")
print(f"🎵 Total unique artists: {len(artist_stats)}")
print(f"🌟 Top 10 artists by track count:")
for artist, count in top_artists:
    print(f"   - {artist}: {count} tracks")
