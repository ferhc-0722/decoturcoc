'use client';
import { useFormStatus } from 'react-dom';

// Botón de envío del panel: muestra un spinner mientras el formulario se guarda
export default function BotonEnvio({ children, className = '', pendingText = 'Guardando…', ...props }) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      type="submit"
      className={`${className} ${pending ? 'guardando' : ''}`.trim()}
      disabled={pending || props.disabled}
      aria-busy={pending || undefined}
    >
      {pending && <span className="spinner" aria-hidden="true" />}
      <span>{pending ? pendingText : children}</span>
    </button>
  );
}
