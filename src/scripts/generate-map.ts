import '../env'
import axios from 'axios';
import { WardMapper } from '../warding/WardMapper';
import path from 'path';
import fs from 'fs';
import { LinearTransformer } from '../warding/LinearTransformer';

const STRATZ_API_KEY = process.env.STRATZ_API_KEY;
if (!STRATZ_API_KEY) throw new Error("STRATZ_API_KEY is required");
const minimapFilepath = path.join(__dirname, '../../assets/minimap.jpg');

const transformations = JSON.parse(fs.readFileSync(path.join(__dirname, '../../assets/map-transformation.json'), 'utf-8'));
const xTransformer = new LinearTransformer(transformations.x0, transformations.x1);
const yTransformer = new LinearTransformer(transformations.y0, transformations.y1);
const wardMapper = new WardMapper(minimapFilepath, xTransformer, yTransformer); 

async function main() {
    const matchId = process.argv[2];
    if (!matchId) {
        throw new Error("Match ID is required as a command line argument");
    }
    let wards = await getWardsInMatch(parseInt(matchId));
    fs.writeFileSync(`wards_${matchId}.json`, JSON.stringify(wards, null, 2));
    // wards = wards.match.playbackData.wardEvents.filter((ward: any) => ward.wardType === 'OBSERVER');
    wards = wards.match.playbackData.wardEvents;
    const mapBuffer = await wardMapper.buildMap(wards);
    await fs.promises.writeFile(`ward_map_${matchId}.jpg`, mapBuffer);
}

async function getWardsInMatch(matchId: number) {
    {
        const query = `
{
  match(id: ${matchId}) {
    players {
      steamAccount {
        name
      }
      playerSlot
      isRadiant
      kills
      assists
      deaths
    }
    playbackData {
      wardEvents {
        time
        positionX
        positionY
        wardType
        fromPlayer
        playerDestroyed
      }
    }
  }
}
`
        const response = await axios.post('https://api.stratz.com/graphql',
         { query },
         { headers: {
             Authorization: `Bearer ${STRATZ_API_KEY}`,
             "Content-Type": "application/json",
             "User-Agent": "STRATZ_API",
            },
        }
    );
        return response.data.data
    }
}

main()
    .then(() => {
        console.log("✅ Ward maps checked successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ An error occurred while checking ward maps:", error);
        process.exit(1);
    })