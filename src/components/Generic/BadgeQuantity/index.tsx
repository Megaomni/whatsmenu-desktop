import { Badge } from "react-bootstrap";

type BadgeQuantityProps = {
    title: string;
    number: number;
    bg?: "string";
    className?: string;
    style?: React.CSSProperties

}

export function BadgeQuantity({ title, number, bg, className, style }: BadgeQuantityProps) {
    return <Badge bg={bg || "secondary"} className={className || ""} style={{ ...style }} title={title}> {number}</Badge>
}