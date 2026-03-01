declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
  interface Element {}
}

declare module "react" {
  export type ReactNode = string | number | boolean | null | undefined | JSX.Element | ReactNode[];
}

declare module "next" {
  export interface Metadata {
    title?: string;
    description?: string;
  }
}

declare module "next/link" {
  export default function Link(props: { href: string; className?: string; children?: import("react").ReactNode; [key: string]: unknown }): JSX.Element;
}

declare module "next/server" {
  export class NextResponse {
    static json(data: unknown, init?: { status?: number }): NextResponse;
  }
}
