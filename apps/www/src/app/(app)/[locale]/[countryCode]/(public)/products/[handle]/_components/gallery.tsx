'use client';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Accordion } from '@radix-ui/react-accordion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const questions = [
  {
    question: 'Informacion de Delivery',
    answer:
      'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Assumenda cum amet blanditiis quis vero saepe quo veritatis ab dicta ratione cumque, labore velit omnis sequi voluptatem harum distinctio reiciendis eveniet!',
  },
  {
    question: 'Guia de tallas',
    answer: (
      <div className='relative mt-2 flex aspect-video justify-center'>
        <Image
          className='h-full w-full object-cover'
          src='https://cdn.shopify.com/s/files/1/0584/4693/8291/files/Horizontal_size_guide_TEST_2_1.jpg?v=1633450865'
          alt='Tallas'
          fill
        />
      </div>
    ),
  },
];

interface Props {
  images: string[];
}

export function Gallery({ images }: Props) {
  const [activeSection, setActiveSection] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState<number | null>(null);
  const [isModalZoomed, setIsModalZoomed] = useState(false);
  const modalImageRef = useRef<HTMLImageElement>(null);

  const openModal = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
    setIsModalZoomed(false); // zoom open
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImageIndex(null);
    setIsModalZoomed(false);
  };

  const nextImage = () => {
    if (modalImageIndex !== null && images.length > 0) {
      setModalImageIndex((prevIndex) =>
        prevIndex === null ? 0 : (prevIndex + 1) % images.length,
      );
    }
  };

  const prevImage = () => {
    if (modalImageIndex !== null && images.length > 0) {
      setModalImageIndex((prevIndex) =>
        prevIndex === null
          ? 0
          : (prevIndex - 1 + images.length) % images.length,
      );
    }
  };

  const handleModalImageClick = () => {
    setIsModalZoomed(!isModalZoomed);
  };

  useEffect(() => {
    if (modalImageRef.current && isModalOpen) {
    }
  }, [isModalOpen, modalImageIndex]);

  const scrollToSection = (index: number) => {
    setActiveSection(index);
    const element =
      index === 0
        ? document.getElementById('image-container-0')
        : document.getElementById('image-container-1');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentModalImage =
    modalImageIndex !== null ? images[modalImageIndex] : null;
  const hasMultipleGalleryImages = images.length > 1;
  const zoomScale = 2;

  return (
    <div className='flex w-full flex-1 flex-col'>
      <div className='flex'>
        {hasMultipleGalleryImages && (
          <div className='mt-2 mr-4 flex flex-col items-start justify-start'>
            {Array.from({ length: images.length }).map((_, index) => (
              <button
                key={index}
                className={`border-primary mb-1 h-3 w-3 rounded-full border-1 ${
                  activeSection === index ? 'bg-primary' : 'bg-transparent'
                }`}
                onClick={() => scrollToSection(index)}
              ></button>
            ))}
          </div>
        )}
        <div className='mx-auto flex w-full max-w-[700px] flex-col gap-8'>
          {images.map((img, index) => (
            <section
              key={index}
              id={`image-container-${index}`}
              className='relative w-full cursor-pointer overflow-hidden shadow-md'
              onClick={() => openModal(index)}
            >
              <Image
                src={img}
                className='h-auto w-full object-contain'
                alt={`Imagen ${index + 1}`}
                width={400}
                height={400}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </section>
          ))}

          <div className='mt-10 w-full'>
            <Accordion
              type='single'
              collapsible
              className='gap-2'
            >
              {questions.map((q, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                >
                  <AccordionTrigger className='text-left text-base font-semibold md:text-lg'>
                    {q.question}
                  </AccordionTrigger>
                  <AccordionContent className='leading-relaxed'>
                    {q.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {isModalOpen && currentModalImage && (
        <div className='bg-opacity-80 bg-secondary fixed top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center'>
          <div
            className='relative flex items-center justify-center'
            style={{ maxHeight: '90vh', maxWidth: '90vw', cursor: 'zoom-in' }}
            onClick={handleModalImageClick}
          >
            <Image
              src={currentModalImage}
              alt='Imagen ampliada'
              style={{
                maxHeight: '90vh',
                maxWidth: '90vw',
                objectFit: 'contain',
                transform: isModalZoomed ? `scale(${zoomScale})` : 'scale(1)',
                transition: 'transform 0.3s ease-in-out',
                transformOrigin: 'center',
              }}
              width={1200}
              height={900}
              ref={modalImageRef}
            />
          </div>
          <div className='mt-4 flex items-center space-x-4'>
            {hasMultipleGalleryImages && (
              <button
                className='bg-primary text-secondary rounded-full p-2'
                onClick={prevImage}
                aria-label='Imagen anterior'
              >
                <ChevronLeft className='h-6 w-6' />
              </button>
            )}
            <button
              className='bg-primary text-secondary rounded-full p-2'
              onClick={closeModal}
              aria-label='Cerrar'
            >
              <X className='h-6 w-6' />
            </button>
            {hasMultipleGalleryImages && (
              <button
                className='bg-primary text-secondary rounded-full p-2'
                onClick={nextImage}
                aria-label='Imagen siguiente'
              >
                <ChevronRight className='h-6 w-6' />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
