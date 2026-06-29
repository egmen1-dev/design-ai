import { prisma } from "@/lib/prisma";

export type LibraryFontRecord = {
  id: string;
  name: string;
  cssImport: string;
  fontFamily: string;
  styleTags: string[];
};

export type LibraryBadgeRecord = {
  id: string;
  name: string;
  htmlTemplate: string;
  styleTags: string[];
};

export type DesignLibrary = {
  fonts: LibraryFontRecord[];
  badges: LibraryBadgeRecord[];
};

export async function loadDesignLibrary(): Promise<DesignLibrary> {
  const [fonts, badges] = await Promise.all([
    prisma.libraryFont.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        cssImport: true,
        fontFamily: true,
        styleTags: true,
      },
    }),
    prisma.libraryBadge.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        htmlTemplate: true,
        styleTags: true,
      },
    }),
  ]);

  return { fonts, badges };
}

export async function resolveLibraryAssets(
  fontId?: string | null,
  badgeId?: string | null,
): Promise<{
  font: Awaited<ReturnType<typeof prisma.libraryFont.findUnique>>;
  badge: Awaited<ReturnType<typeof prisma.libraryBadge.findUnique>>;
}> {
  const [font, badge] = await Promise.all([
    fontId ? prisma.libraryFont.findUnique({ where: { id: fontId } }) : null,
    badgeId ? prisma.libraryBadge.findUnique({ where: { id: badgeId } }) : null,
  ]);

  return { font, badge };
}

export function formatLibraryForPrompt(library: DesignLibrary): string {
  const fontsBlock =
    library.fonts.length === 0
      ? "Шрифты: (пусто — fontId: null)"
      : library.fonts
          .map(
            (font) =>
              `- id: ${font.id}, name: "${font.name}", styleTags: [${font.styleTags.join(", ")}]`,
          )
          .join("\n");

  const badgesBlock =
    library.badges.length === 0
      ? "Плашки: (пусто — badgeId: null)"
      : library.badges
          .map(
            (badge) =>
              `- id: ${badge.id}, name: "${badge.name}", styleTags: [${badge.styleTags.join(", ")}]`,
          )
          .join("\n");

  return `Доступные шрифты (выбери fontId или null):\n${fontsBlock}\n\nДоступные плашки (выбери badgeId или null):\n${badgesBlock}`;
}
