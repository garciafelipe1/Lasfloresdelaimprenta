import Image from 'next/image';
import { Card, CardContent, CardFooter } from '../ui/card';

interface TestimonialProp {
  imageUrl: string;
  content: string;
  name: string;
  occupation: string;
}

export function Testiomial({
  content,
  imageUrl,
  name,
  occupation,
}: TestimonialProp) {
  return (
    <Card className='max-w-[300px] justify-between '>
      <CardContent className='font-light'>{content}</CardContent>
      <CardFooter className='gap-2'>
        <div className='relative h-10 w-10'>
          <Image
            className='h-full w-full rounded object-cover'
            src={imageUrl}
            alt='avatar'
            fill
          />
        </div>
        <div className='flex flex-1 flex-col items-start justify-start gap-0'>
          <p className='md:text-md m-0 text-base font-medium'>{name}</p>
          <span className='text-primary/50 text-xs'>{occupation}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
