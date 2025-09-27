import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/app/components/ui/breadcrumb';

interface Props {
  title: string;
}

export function ProductBreadcrumb({ title }: Props) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className='m-0'>
          <BreadcrumbLink
            href='/catalog'
            className='hover:underline'
          >
            Catálogo
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className='m-0' />
        <BreadcrumbItem className='m-0 capitalize'>
          {title.replace('-', ' ')}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
