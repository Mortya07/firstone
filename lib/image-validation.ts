import {PhotonImage} from '@cf-wasm/photon/workerd';
import {HttpError} from './security';

export const MAX_IMAGE_BYTES=5*1024*1024;
export const MAX_IMAGE_PIXELS=4_000_000;
const fail=()=>new HttpError(415,'Файл повреждён или не является фотографией JPG, PNG или WebP.');
const text=(b:Uint8Array,start:number,end:number)=>new TextDecoder().decode(b.subarray(start,end));
function dimensions(width:number,height:number){
  if(!width||!height||width>4096||height>4096||width*height>MAX_IMAGE_PIXELS)
    throw new HttpError(413,'Уменьшите фотографию: не более 4 миллионов пикселей и 4096 пикселей по стороне.');
  return {width,height};
}

// Check allocation bounds BEFORE invoking the full decoder. Reject animation and
// mismatched canvas/frame dimensions; a small file can expand into a huge bitmap.
export function imageHeader(b:Uint8Array,contentType:string|null){
  const v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(b.length>24&&[137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x)){
    if(contentType!=='image/png'||v.getUint32(8)!==13||text(b,12,16)!=='IHDR')throw fail();
    const size=dimensions(v.getUint32(16),v.getUint32(20));
    let end=false;
    for(let p=8;p+12<=b.length;){const len=v.getUint32(p);if(len>b.length-p-12)throw fail();const type=text(b,p+4,p+8);
      if(type==='acTL'||(p!==8&&type==='IHDR'))throw fail();
      p+=len+12;if(type==='IEND'){if(len!==0||p!==b.length)throw fail();end=true;break;}}
    if(!end)throw fail();return {...size,mime:'image/png'};
  }
  if(b.length>12&&text(b,0,4)==='RIFF'&&text(b,8,12)==='WEBP'){
    if(contentType!=='image/webp'||v.getUint32(4,true)!==b.length-8)throw fail();
    let canvas:ReturnType<typeof dimensions>|undefined,frame:ReturnType<typeof dimensions>|undefined;
    for(let p=12;p<b.length;){if(p+8>b.length)throw fail();const type=text(b,p,p+4),len=v.getUint32(p+4,true),start=p+8;
      if(len>b.length-start)throw fail();
      if(type==='ANIM'||type==='ANMF')throw fail();
      if(type==='VP8X'){if(canvas||len!==10||(b[start]&2))throw fail();canvas=dimensions(1+b[start+4]+(b[start+5]<<8)+(b[start+6]<<16),1+b[start+7]+(b[start+8]<<8)+(b[start+9]<<16));}
      if(type==='VP8 '){if(frame||len<10||b[start+3]!==157||b[start+4]!==1||b[start+5]!==42)throw fail();frame=dimensions(v.getUint16(start+6,true)&16383,v.getUint16(start+8,true)&16383);}
      if(type==='VP8L'){if(frame||len<5||b[start]!==47)throw fail();const bits=v.getUint32(start+1,true);frame=dimensions(1+(bits&16383),1+((bits>>>14)&16383));}
      p=start+len+(len&1);if(p>b.length)throw fail();
    }
    if(!frame||(canvas&&(canvas.width!==frame.width||canvas.height!==frame.height)))throw fail();return {...frame,mime:'image/webp'};
  }
  if(b.length>4&&b[0]===255&&b[1]===216){
    if(contentType!=='image/jpeg'||b[b.length-2]!==255||b[b.length-1]!==217)throw fail();
    let size:ReturnType<typeof dimensions>|undefined;
    for(let p=2;p<b.length;){if(b[p++]!==255)throw fail();while(b[p]===255)p++;const marker=b[p++];
      if(marker===218){if(!size)throw fail();break;}
      if(marker===0||marker===216||marker===217||p+2>b.length)throw fail();
      const len=v.getUint16(p);if(len<2||p+len>b.length)throw fail();
      if([192,193,194].includes(marker)){if(size||len<8)throw fail();size=dimensions(v.getUint16(p+5),v.getUint16(p+3));}
      else if(marker>=195&&marker<=207&&![196,200,204].includes(marker))throw fail();
      p+=len;
    }
    if(!size)throw fail();return {...size,mime:'image/jpeg'};
  }
  throw fail();
}

export function normalizePhoto(bytes:Uint8Array,contentType:string|null){
  const header=imageHeader(bytes,contentType);let image:PhotonImage|undefined;
  try{
    image=PhotonImage.new_from_byteslice(bytes);
    if(image.get_width()!==header.width||image.get_height()!==header.height)throw fail();
    // Re-encode the decoded pixels, never store the original file, EXIF, GPS,
    // comments, extra chunks or appended payload. Portfolio photos are opaque JPEG.
    const clean=image.get_bytes_jpeg(85);
    if(clean.length>MAX_IMAGE_BYTES)throw new HttpError(413,'Фотография слишком большая после обработки.');
    return clean;
  }catch(error){if(error instanceof HttpError)throw error;throw fail();}
  finally{image?.free();}
}
