import Image from 'next/image';

export function FooterBanner() {
  return (
    <div className='relative flex aspect-[16/4] w-full justify-center'>
      <Image
        className='h-full w-full object-contain'
        fill
        src='https://upload.snrcdn.net/182bc36876d08dadfd868786f82ce21a2596bd55/default/origin/2cd293d1bbb545b88dafca427c63e968.jpg'
        alt={`Banner`}
      />
    </div>
  );
}
