import Button from "@/components/shared/Button";
import { BugIcon } from "../icons";

export default function BugReport() {
  return (
    <Button
      className="fixed bottom-12 sm:right-10 -right-5 sm:rotate-0 rotate-90 mt-8"
      text="Report a bug"
      url="/"
      icon={<BugIcon />}
    />
  );
}
