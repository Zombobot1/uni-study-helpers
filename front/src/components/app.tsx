import { Button, Stack, styled } from '@material-ui/core';
import { useEffect, useState } from 'react';

const Img = styled('img')({
  width: '100%',
  height: '100%',
});

async function verifyPermission(handle: any) {
  const options = { mode: 'readwrite' };
  if ((await handle.queryPermission(options)) === 'granted') return true;
  if ((await handle.requestPermission(options)) === 'granted') return true;
  return false;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function imageType(buffer: ArrayBuffer): string {
  const arr = new Uint8Array(buffer).subarray(0, 4);
  let header = '';
  for (let i = 0; i < arr.length; i++) {
    header += arr[i].toString(16);
  }

  switch (header) {
    case '89504e47':
      return 'png';
    case '47494638':
      return 'gif';
    case 'ffd8ffe0':
    case 'ffd8ffe1':
    case 'ffd8ffe2':
    case 'ffd8ffe3':
    case 'ffd8ffe8':
      return 'jpeg';
    default:
      throw new Error('Bad image');
  }
}

function useDirHandler() {
  const [dir, setDir] = useState<any>(null);

  useEffect(() => {
    if (dir) verifyPermission(dir);
  }, [dir]);

  async function createFile(file: string, content: ArrayBuffer | string) {
    if (!dir) return;

    const fileH = await dir.getFileHandle(file, { create: true });
    const writable = await fileH.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async function createImage(name: string, content: ArrayBuffer): Promise<string> {
    const path = `${name}.${imageType(content)}`;
    await createFile(path, content);
    return path;
  }

  async function createAudio(file: string, content: ArrayBuffer) {
    await createFile(file, content);
  }

  async function createText(file: string, content: string) {
    await createFile(file, content);
  }

  async function readFile(path: string): Promise<ArrayBuffer> {
    if (!dir) return new ArrayBuffer(0);

    const fileH = await dir.getFileHandle(path, { create: true });
    const file = await fileH.getFile();
    return file.arrayBuffer();
  }

  async function readImage(path: string): Promise<string> {
    const buffer = await readFile(path);
    return URL.createObjectURL(new Blob([buffer]));
  }
  return { dir, setDir, createImage, readImage, createAudio, createText };
}

async function writeText(dirHandle: any) {
  const uniDir = await dirHandle.getDirectoryHandle('uni-resources', { create: true });
}

async function loadImg(): Promise<ArrayBuffer> {
  const img = await fetch('https://picsum.photos/2000/2000');
  const arr = await img.arrayBuffer();
  return arr;
}

async function loadMp3(): Promise<ArrayBuffer> {
  const audio = await fetch('https://dictionary.cambridge.org/media/english/us_pron/e/eus/eus73/eus73647.mp3');
  const arr = await audio.arrayBuffer();
  return arr;
}

export const useGlobalEventListener = (eventName: string, handler: (e: Event) => void, isReady = true) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEffect(() => {
    const eventListener = (event: Event) => handler(event);
    window.addEventListener(eventName, eventListener);
    return () => window.removeEventListener(eventName, eventListener);
  }, [eventName, isReady]);
};

function retrieveImageFromClipboard(pasteEvent: ClipboardEvent): File | null {
  if (!pasteEvent.clipboardData) return null;

  const items = pasteEvent.clipboardData.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.includes('image')) return items[i].getAsFile();
  }

  return null;
}

async function retrieveImageFromClipboardAsBlob(pasteEvent: ClipboardEvent): Promise<[string, File | null]> {
  const image = retrieveImageFromClipboard(pasteEvent);
  if (!image) return ['', null];
  return [URL.createObjectURL(image), image];
}

interface SP {
  createText: (f: string, t: string) => Promise<void>;
  createImage: (fn: string, i: ArrayBuffer) => Promise<string>;
  readImage: (f: string) => Promise<string>;
}
function S({ createImage, createText, readImage }: SP) {}

export function App() {
  const [img, setImg] = useState('');
  const [audio, setAudio] = useState('');
  const { dir, setDir, createImage, readImage, createText, createAudio } = useDirHandler();

  useGlobalEventListener(
    'paste',
    async (e) => {
      const [str, file] = await retrieveImageFromClipboardAsBlob(e as ClipboardEvent);
      setImg(str);
      if (file) createImage('clipboard', await file.arrayBuffer());
    },
    Boolean(dir),
  );

  const onClick = async () => {
    // const i = await readImage('clipboard.png');
    // setImg(i);
    const buffer = await loadMp3();
    setAudio(URL.createObjectURL(new Blob([buffer])));
    await createAudio('test.mp3', buffer);
    // await createText('text.txt', 'test');
  };

  return (
    <Stack spacing={2} sx={{ width: '500px', height: '500px' }}>
      {img && <Img src={img} />}
      {audio && <audio controls src={audio} />}
      {!dir && (
        <Button
          variant="contained"
          onClick={() => window.showDirectoryPicker({ id: 'uni', startIn: 'documents' }).then((d: any) => setDir(d))}
        >
          Pick dir
        </Button>
      )}
      <Button variant="contained" onClick={onClick}>
        Load
      </Button>
    </Stack>
  );
}
