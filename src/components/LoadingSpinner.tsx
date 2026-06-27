interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-10 h-10 border-2",
};

const LoadingSpinner = ({ size = "md", className = "" }: LoadingSpinnerProps) => (
  <div
    className={`${sizeClasses[size]} border-primary border-t-transparent animate-spin ${className}`}
  />
);

export default LoadingSpinner;
