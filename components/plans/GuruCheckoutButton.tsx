import { buildGuruCheckoutUrl } from "@/lib/plans/checkoutUrl";
import { GURU_PRICE_LABEL } from "@/lib/plans/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GuruCheckoutButtonProps {
  userId: string;
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
}

export function GuruCheckoutButton({
  userId,
  size = "default",
  className,
  label = `Pay ${GURU_PRICE_LABEL} — get Guru`,
}: GuruCheckoutButtonProps) {
  const checkoutUrl = buildGuruCheckoutUrl(userId);

  return (
    <Button asChild size={size} className={cn(className)}>
      <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    </Button>
  );
}
