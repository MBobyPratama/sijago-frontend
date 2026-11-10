import "./report-description.css";

export interface ReportDescriptionData { items: { label: string; value: string }[]; condition: string | null }
export function ReportDescription({ description, fallbackBody }: { description?: ReportDescriptionData | null; fallbackBody?: string }) {
  if (!description) {
    const lines = (fallbackBody || "").split("\n");
    const points = lines.filter(line => line.startsWith("- "));
    const rest = lines.filter(line => !line.startsWith("- ")).join("\n").trim();
    return <div className="report-description">{points.length > 0 && <ul>{points.map((line, index) => <li key={index}>{line.slice(2)}</li>)}</ul>}{rest && <p>{rest}</p>}</div>;
  }
  return <div className="report-description"><ul>{description.items.map(item => <li key={item.label}><strong>{item.label}:</strong> {item.value}</li>)}</ul>{description.condition && <div className="report-description-condition"><h4>Kondisi di lapangan</h4><p>{description.condition}</p></div>}</div>;
}
