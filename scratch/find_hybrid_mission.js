const fs = require('fs');
const readline = require('readline');

async function findMission() {
  const fileStream = fs.createReadStream('C:\\Users\\yakoub\\.gemini\\antigravity-ide\\brain\\79bcd61a-c90f-4277-ac6e-0b1eb4b532dd\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('Structurer le moteur de diagnostic automobile hybride') && line.includes('"type":"USER_INPUT"')) {
      const obj = JSON.parse(line);
      fs.writeFileSync('scratch/hybrid_mission.txt', obj.content, 'utf8');
      console.log('Saved hybrid_mission.txt! Length:', obj.content.length);
      break;
    }
  }
}

findMission().catch(console.error);
