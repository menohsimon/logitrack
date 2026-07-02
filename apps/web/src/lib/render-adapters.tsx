import Link from "next/link";
import type { ComponentProps } from "react";

import { asRoute } from "@/lib/routes";

/** base-ui `render` prop expects a function adapter, not a React element */
export function asLinkRender(href: string) {
	return function linkRender({ href: _href, ...props }: ComponentProps<"a">) {
		return <Link href={asRoute(href)} {...props} />;
	};
}

export function asAnchorRender(href: string) {
	return function anchorRender(props: ComponentProps<"a">) {
		return <a href={href} {...props} />;
	};
}
