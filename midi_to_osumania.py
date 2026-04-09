import mido
import sys
from pathlib import Path


def midi_to_osumania(midi_path, output_path=None, bpm=130):
    # Parse MIDI file
    mid = mido.MidiFile(midi_path)

    # Find all unique notes and map them to lanes (0-5)
    note_to_lane = {}
    all_notes = set()

    # First pass: collect all unique notes
    for track in mid.tracks:
        for msg in track:
            if msg.type == 'note_on' and msg.velocity > 0:
                all_notes.add(msg.note)

    # Sort notes and map to lanes (0-5)
    sorted_notes = sorted(all_notes)
    if len(sorted_notes) > 6:
        print(f"Warning: Found {len(sorted_notes)} unique notes, using lowest 6")
        sorted_notes = sorted_notes[:6]
    elif len(sorted_notes) < 6:
        print(f"Warning: Found only {len(sorted_notes)} unique notes")

    for i, note in enumerate(sorted_notes):
        note_to_lane[note] = i

    print(f"Note mapping: {note_to_lane}")

    # Calculate column x positions for 6K (512 pixels wide playfield)
    # Columns are evenly distributed: 0, 85, 170, 256, 341, 426
    lane_x_positions = [int(i * 512 / 6) for i in range(6)]

    # Second pass: extract note events with timing
    hit_objects = []
    current_time_ms = 0

    for track in mid.tracks:
        current_time_ms = 0
        for msg in track:
            # Convert delta time from ticks to milliseconds
            current_time_ms += mido.tick2second(msg.time, mid.ticks_per_beat,
                                                mido.bpm2tempo(bpm)) * 1000

            if msg.type == 'note_on' and msg.velocity > 0:
                if msg.note in note_to_lane:
                    lane = note_to_lane[msg.note]
                    x = lane_x_positions[lane]
                    # osu!mania hit object format: x,y,time,type,hitSound,endTime:hitSample
                    # type=1 for normal hit circle (128 for mania note)
                    # y is always 192 for mania
                    hit_objects.append({
                        'time': int(current_time_ms),
                        'x': x,
                        'lane': lane,
                        'note': msg.note
                    })

    # Sort by time
    hit_objects.sort(key=lambda x: x['time'])

    # Generate .osu file
    if output_path is None:
        output_path = Path(midi_path).stem + '.osu'

    osu_content = generate_osu_file(hit_objects, bpm, Path(midi_path).name)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(osu_content)

    print(f"\nConverted {len(hit_objects)} notes")
    print(f"Output written to: {output_path}")

    return hit_objects


def generate_osu_file(hit_objects, bpm, audio_filename):
    """Generate a complete .osu file with the hit objects"""

    ms_per_beat = 60000 / bpm

    content = f"""osu file format v14

[General]
AudioFilename: {audio_filename}
AudioLeadIn: 0
PreviewTime: -1
Countdown: 0
SampleSet: Normal
StackLeniency: 0.7
Mode: 3
LetterboxInBreaks: 0
SpecialStyle: 0
WidescreenStoryboard: 0

[Editor]
DistanceSpacing: 1
BeatDivisor: 4
GridSize: 4
TimelineZoom: 1

[Metadata]
Title:MIDI Conversion
TitleUnicode:MIDI Conversion
Artist:Unknown
ArtistUnicode:Unknown
Creator:midi_to_osumania
Version:6K
Source:
Tags:
BeatmapID:0
BeatmapSetID:-1

[Difficulty]
HPDrainRate:8
CircleSize:6
OverallDifficulty:8
ApproachRate:5
SliderMultiplier:1.4
SliderTickRate:1

[Events]
//Background and Video events
//Break Periods
//Storyboard Layer 0 (Background)
//Storyboard Layer 1 (Fail)
//Storyboard Layer 2 (Pass)
//Storyboard Layer 3 (Foreground)
//Storyboard Layer 4 (Overlay)
//Storyboard Sound Samples

[TimingPoints]
0,{ms_per_beat},4,2,0,100,1,0

[HitObjects]
"""

    # Add hit objects
    # Format: x,y,time,type,hitSound,endTime:hitSample
    # For mania: x determines column, y is always 192, type is 1 for normal note (128 for hold)
    for obj in hit_objects:
        content += f"{obj['x']},192,{obj['time']},1,0,0:0:0:0:\n"

    return content


def main():
    if len(sys.argv) < 2:
        print("Usage: python midi_to_osumania.py <midi_file> [output_file] [bpm]")
        print("Example: python midi_to_osumania.py song.mid song.osu 140")
        sys.exit(1)

    midi_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    bpm = float(sys.argv[3]) if len(sys.argv) > 3 else 120

    if not Path(midi_path).exists():
        print(f"Error: MIDI file '{midi_path}' not found")
        sys.exit(1)

    midi_to_osumania(midi_path, output_path, bpm)


if __name__ == '__main__':
    main()
