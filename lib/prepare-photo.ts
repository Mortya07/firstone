'use client';

// Browser resizing is a UX optimisation, NOT the server's security boundary.
// Large phone photos are oriented by the browser then reduced before upload.
export async function preparePhoto(file:File):Promise<Blob>{
  const image=await createImageBitmap(file,{imageOrientation:'from-image'});
  try{
    const scale=Math.min(1,2000/image.width,2000/image.height);
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Не удалось обработать фото.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Не удалось обработать фото.')),'image/jpeg',0.9));
  }finally{image.close();}
}
