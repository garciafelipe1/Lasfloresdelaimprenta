import { LoaderCircle } from 'lucide-react';
import { Button, ButtonProps } from './button';

type Props = ButtonProps & {
  isLoading?: boolean;
};

export function FormButton({ children, isLoading = false, ...props }: Props) {
  return (
    <Button
      data-loading={isLoading ? '' : null}
      className='group grid'
      {...props}
    >
      <span className='[grid-area:1/1] group-data-loading:invisible'>
        {children}
      </span>
      <span className='invisible [grid-area:1/1] group-data-loading:visible'>
        <LoaderCircle className='text-background mx-auto animate-spin' />
      </span>
    </Button>
  );
}
