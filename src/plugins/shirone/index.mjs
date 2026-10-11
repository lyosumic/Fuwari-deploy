// Standalone Shirone Markdown capabilities. MIT notices: docs/LICENSE-Shirone.txt.

import { remarkCodeTree } from "./markdown/code/remark-code-tree.mjs";
import { remarkFileTree } from "./markdown/code/remark-file-tree.mjs";
import { CodeTreeComponent } from "./markdown/containers/rehype-code-tree.mjs";
import {
	CollapsePanelsComponent,
	rehypeCollapseGroups,
} from "./markdown/containers/rehype-collapse-panels.mjs";
import {
	FieldComponent,
	FieldGroupComponent,
} from "./markdown/containers/rehype-fields.mjs";
import { FileTreeComponent } from "./markdown/containers/rehype-file-tree.mjs";
import {
	OptionGroupsComponent,
	rehypeOptionGroupIds,
} from "./markdown/containers/rehype-option-groups.mjs";
import { StepsComponent } from "./markdown/containers/rehype-steps.mjs";
import { remarkAbbreviations } from "./markdown/remark-abbreviations.mjs";
import { remarkAcFun } from "./markdown/remark-acfun.mjs";
import { remarkArtPlayer } from "./markdown/remark-artplayer.mjs";
import { remarkAudioReader } from "./markdown/remark-audio-reader.mjs";
import { remarkBilibili } from "./markdown/remark-bilibili.mjs";
import { remarkCollapsePanels } from "./markdown/remark-collapse-panels.mjs";
import { remarkContentAnnotations } from "./markdown/remark-content-annotations.mjs";
import { remarkFields } from "./markdown/remark-fields.mjs";
import { remarkIncludes } from "./markdown/remark-includes.mjs";
import { remarkMarker } from "./markdown/remark-marker.mjs";
import { remarkOptionGroups } from "./markdown/remark-option-groups.mjs";
import { remarkYouTube } from "./markdown/remark-youtube.mjs";
import { AcFunComponent } from "./rehype-component-acfun.mjs";
import { ArtPlayerComponent } from "./rehype-component-artplayer.mjs";
import { AudioReaderComponent } from "./rehype-component-audio-reader.mjs";
import { BilibiliComponent } from "./rehype-component-bilibili.mjs";
import { ImageGridComponent } from "./rehype-component-image-grid.mjs";
import { MarkerComponent } from "./rehype-component-marker.mjs";
import { SpoilerComponent } from "./rehype-component-spoiler.mjs";
import { YouTubeComponent } from "./rehype-component-youtube.mjs";
import { remarkMermaid } from "./remark-mermaid.mjs";

export const preprocessingPlugins = [
	remarkIncludes,
	remarkContentAnnotations,
	remarkAbbreviations,
	remarkCollapsePanels,
	remarkOptionGroups,
	remarkMarker,
	remarkFileTree,
	remarkCodeTree,
	remarkFields,
	remarkMermaid,
];
export const directivePlugins = [
	remarkAcFun,
	remarkAudioReader,
	remarkArtPlayer,
	remarkBilibili,
	remarkYouTube,
];
export const structuralPlugins = [rehypeCollapseGroups, rehypeOptionGroupIds];
export const components = {
	"m3-mark": MarkerComponent,
	spoiler: SpoilerComponent,
	grid: ImageGridComponent,
	collapse: CollapsePanelsComponent,
	tabs: OptionGroupsComponent,
	steps: StepsComponent,
	"file-tree": FileTreeComponent,
	"code-tree": CodeTreeComponent,
	"field-group": FieldGroupComponent,
	field: (properties, children) =>
		FieldComponent(
			{
				...properties,
				"label-required": "必填",
				"label-optional": "可选",
				"label-deprecated": "已弃用",
			},
			children,
		),
	"audio-reader": AudioReaderComponent,
	artplayer: ArtPlayerComponent,
	acfun: AcFunComponent,
	bilibili: BilibiliComponent,
	youtube: YouTubeComponent,
};
