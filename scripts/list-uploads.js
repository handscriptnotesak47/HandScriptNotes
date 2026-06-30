import fs from 'fs';

function listFiles() {
  const dir = './uploads';
  if (fs.existsSync(dir)) {
    console.log('Files in ./uploads:');
    fs.readdirSync(dir).forEach(file => {
      console.log(' -', file, fs.statSync(`${dir}/${file}`).size, 'bytes');
    });
  } else {
    console.log('uploads directory does not exist');
  }
}

listFiles();
