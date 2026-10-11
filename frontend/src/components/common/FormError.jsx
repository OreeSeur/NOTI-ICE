export const FormError = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-200">
      {message}
    </p>
  );
};
