const fs = require('fs');

const worlds = [];
const imageStyles = ['cyberpunk', 'fantasy', 'scifi', 'medieval', 'steampunk', 'post-apocalyptic', 'noir', 'mythical', 'space', 'dystopian'];
const animeStyles = ['Jujutsu Kaisen', 'Demon Slayer', 'Naruto', 'One Piece', 'Attack on Titan', 'My Hero Academia', 'Bleach', 'Sword Art Online', 'Hunter x Hunter', 'Tokyo Ghoul'];

// Generate 1500 Normal Worlds
for (let i = 1; i <= 1500; i++) {
  const style = imageStyles[Math.floor(Math.random() * imageStyles.length)];
  worlds.push({
    id: `world-${i}`,
    title: `World Reality #${i}`,
    genre: style.charAt(0).toUpperCase() + style.slice(1),
    img: `https://image.pollinations.ai/prompt/${style}%20epic%20landscape%20cinematic%20concept%20art?width=400&height=300&nologo=true&seed=${i}`,
    type: 'Normal'
  });
}

// Generate 2500 Anime Worlds
for (let i = 1501; i <= 4000; i++) {
  const anime = animeStyles[Math.floor(Math.random() * animeStyles.length)];
  worlds.push({
    id: `world-${i}`,
    title: `Anime Reality #${i - 1500}`,
    genre: anime,
    img: `https://image.pollinations.ai/prompt/${anime.replace(/ /g, '%20')}%20epic%20landscape%20anime%20style%20concept%20art?width=400&height=300&nologo=true&seed=${i}`,
    type: 'Anime'
  });
}

fs.writeFileSync('./src/data/worlds.json', JSON.stringify(worlds, null, 2));
console.log('Successfully generated 4000 worlds in src/data/worlds.json');
