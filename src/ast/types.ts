export interface BaseNode {
  kind: string;
  line: number;
  column: number;
  marks?: Record<string, unknown>;
}

export interface SourceLocation {
  line: number;
  column: number;
  file?: string;
}
