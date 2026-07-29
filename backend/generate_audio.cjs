const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_d0f32887b92e59973490c747115ec2ce3bc06cdb2dc63e66';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const soundsToGenerate = [
  { name: 'click.mp3', prompt: 'a very subtle futuristic UI glass click sound effect', duration_seconds: 1 },
  { name: 'void.mp3', prompt: 'deep dark ambient void humming drone sound loop, atmospheric, no melody', duration_seconds: 10 },
  { name: 'timer.mp3', prompt: 'a subtle ticking timer sound', duration_seconds: 2 },
  { name: 'Happy.mp3', prompt: 'cheerful upbeat fantasy town background music loop, lively instruments', duration_seconds: 15 },
  { name: 'Sad.mp3', prompt: 'melancholic emotional sad piano and strings background music loop', duration_seconds: 15 },
  { name: 'Boss.mp3', prompt: 'epic intense god level threat boss battle orchestral choir music loop', duration_seconds: 15 },
  { name: 'Fight.mp3', prompt: 'fast paced action combat anime battle background music loop', duration_seconds: 15 },
  { name: 'Romance.mp3', prompt: 'soft romantic intimate acoustic guitar background music loop', duration_seconds: 15 },
  { name: 'Stealth.mp3', prompt: 'suspenseful investigative stealth spy ambient background music loop', duration_seconds: 15 },
  { name: 'Slick.mp3', prompt: 'smooth jazz bar lounge background music loop', duration_seconds: 15 },
];

async function generateSound(sound) {
  const filePath = path.join(OUTPUT_DIR, sound.name);
  if (fs.existsSync(filePath)) {
    console.log(`Skipping ${sound.name}, already exists.`);
    return;
  }
  
  console.log(`Generating ${sound.name}...`);
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: sound.prompt,
        duration_seconds: sound.duration_seconds,
        prompt_influence: 0.3
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to generate ${sound.name}: ${response.status} - ${text}`);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved ${sound.name}`);
  } catch (err) {
    console.error(`Error generating ${sound.name}:`, err.message);
  }
}

async function run() {
  for (const sound of soundsToGenerate) {
    await generateSound(sound);
  }
  console.log('Finished generating audio files.');
}

run();
