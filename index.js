   const express = require('express');
   const fetch = require('node-fetch');
   const { JSDOM } = require('jsdom');

   const app = express();

   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));

   const ytIdRegex =
     /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/;

   async function downloadVideo(url, type, quality, bitrate, server) {
     if (!ytIdRegex.test(url)) throw 'Invalid URL';
     let ytId = ytIdRegex.exec(url);
     url = 'https://youtu.be/' + ytId[1];

     if (type === 'mp4') {
       if (!quality) quality = '360p';
       if (!bitrate) bitrate = '360';
     } else if (type === 'mp3') {
       quality = '128kbps';
       bitrate = '128';
     } else {
       throw 'Invalid type';
     }

     if (!server) server = 'en68';

     let res = await fetch(`https://www.y2mate.com/mates/${server}/analyze/ajax`, {
       method: 'POST',
       headers: {
         accept: '*/*',
         'accept-language': 'en-US,en;q=0.9',
         'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
       },
       body: new URLSearchParams({
         url,
         q_auto: 0,
         ajax: 1,
       }),
     });
     let json = await res.json();
     let { document } = new JSDOM(json.result).window;
     let tables = document.querySelectorAll('table');
     let table = tables[{ mp4: 0, mp3: 1 }[type] || 0];
     let list;
     switch (type) {
       case 'mp4':
         list = Object.fromEntries(
           [...table.querySelectorAll('td > a[href="#"]')]
             .filter((v) => !/\.3gp/.test(v.innerHTML))
             .map((v) => [
               v.innerHTML.match(/.*?(?=\()/)[0].trim(),
               v.parentElement.nextSibling.nextSibling.innerHTML,
             ])
         );
         break;
       case 'mp3':
         list = {
           '128kbps': table.querySelector('td > a[href="#"]').parentElement.nextSibling.nextSibling.innerHTML,
         };
         break;
       default:
         list = {};
     }
     return list[quality];
   }

   app.get('/', (req, res) => {
     res.send(`
       <form method="POST" action="/download">
         <label for="url">YouTube Video URL:</label>
         <input type="text" name="url" id="url"><br>
         <label for="type">Type:</label>
         <select name="type" id="type">
           <option value="mp4">MP4</option>
           <option value="mp3">MP3</option>
         </select><br>
         <label for="quality">Quality:</label>
         <select name="quality" id="quality">
           <option value="144p">144p</option>
           <option value="240p">240p</option>
           <option value="360p">360p</option>
           <option value="480p">480p</option>
           <option value="720p">720p</option>
           <option value="1080p">1080p</option>
           <option value="1440p">1440p</option>
           <option value="2160p">2160p</option>
         </select><br>
         <label for="bitrate">Bitrate:</label>
         <select name="bitrate" id="bitrate">
           <option value="128">128kbps</option>
           <option value="144">144kbps</option>
           <option value="240">240kbps</option>
           <option value="360">360kbps</option>
           <option value="480">480kbps</option>
           <option value="720">720kbps</option>
           <option value="1080">1080kbps</option>
           <option value="1440">1440kbps</option>
           <option value="2160">2160kbps</option>
         </select><br>
         <label for="server">Server:</label>
         <select name="server" id="server">
           <option value="id4">ID4</option>
           <option value="en60">EN60</option>
           <option value="en61">EN61</option>
           <option value="en68">EN68</option>
         </select><br>
         <button type="submit">Download</button>
       </form>
     `);
   });

   async function downloadVideo(url, type, quality, bitrate, server) {
  // ... existing code ...
  
  if (!list[quality]) {
    throw `Could not find download link for ${quality} ${type} ${bitrate}kbps`;
  }
  
  return list[quality];
}

app.post('/download', async (req, res) => {
  try {
    let url = req.body.url;
    let type = req.body.type;
    let quality = req.body.quality;
    let bitrate = req.body.bitrate;
    let server = req.body.server;

    let downloadLink = await downloadVideo(url, type, quality, bitrate, server);

    res.send(`
      <a href="${downloadLink}" download>Download Link</a>
    `);
  } catch (err) {
    res.send(`
      <p>${err}</p>
    `);
  }
});


   app.listen(3000, () => {
     console.log('Server started on port 3000');
   });
