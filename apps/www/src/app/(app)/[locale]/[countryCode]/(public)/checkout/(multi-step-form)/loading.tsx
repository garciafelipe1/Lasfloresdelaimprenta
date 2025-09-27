export default function loading() {
  return (
    <div className='flex h-full flex-col gap-8'>
      {Array(4)
        .fill(1)
        .map((_n, index) => (
          <div
            key={index}
            className='bg-secondary h-20 animate-pulse rounded-md border'
          />
        ))}
    </div>
  );
}
