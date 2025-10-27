import { Card } from "../ui/card";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  Icon: LucideIcon;
  color: string;
}

export default function StatCard({ title, value, Icon, color }: Props) {
  return (
    <Card className={`p-6 border-2 ${color.replace("text-", "border-")}/20`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 text-gray-700">
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div
          className={`p-3 rounded-md bg-opacity-10 ${color.replace(
            "text-",
            "bg-"
          )}/10`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </Card>
  );
}
