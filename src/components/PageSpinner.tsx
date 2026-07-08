import LoadingSpinner from "@/components/LoadingSpinner";

interface PageSpinnerProps {
  /** Tailwind min-height class for the centering wrapper. */
  minHeight?: string;
}

// Standard full-section loading spinner used by pages and route guards while
// async data loads. Replaces the near-identical inline
// `flex items-center justify-center min-h-[Nvh]` wrappers.
const PageSpinner = ({ minHeight = "min-h-[50vh]" }: PageSpinnerProps) => (
  <div className={`flex items-center justify-center ${minHeight}`}>
    <LoadingSpinner size="lg" />
  </div>
);

export default PageSpinner;
