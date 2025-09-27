import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";
import { Button, Container, toast } from "@medusajs/ui";
import { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { medusaSdk } from "../lib/config";
import "./quill.css";

const ProductDescriptionEditor = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const [description, setDescription] = useState(data.description || "");
  const quillWrapperRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    console.log({ description });

    medusaSdk.admin.product
      .update(data.id, {
        description,
      })
      .then(() => {
        toast.success("Description updated successfully");
      })
      .catch((error) => {
        console.error("Error updating description:", error);
        toast.error("Failed to update description", error.message);
      });
  };

  useEffect(() => {
    const richTextContent = document.querySelector(
      ".text-ui-fg-subtle.grid.w-full.grid-cols-2.items-center.gap-4.px-6.py-4"
    ) as HTMLElement | null;

    if (richTextContent && quillWrapperRef.current) {
      richTextContent.classList.add("hidden");
      // @ts-ignore
      quillWrapperRef.current?.setAttribute("spellcheck", "false");

      // Insert Quill editor at index 0
      richTextContent.parentElement?.insertBefore(
        quillWrapperRef.current,
        richTextContent
      );
    }
  }, []);

  return (
    <div ref={quillWrapperRef}>
      <Container className="divide-y p-0 !rounded-none">
        <div className="px-6 py-4">
          <ReactQuill value={description} onChange={setDescription} />
          <div className="flex justify-end mt-4">
            <Button onClick={handleSave}>Save Description</Button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.before",
});

export default ProductDescriptionEditor;
