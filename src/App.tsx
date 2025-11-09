import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import {
  BrowserRouter as Router,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import heroIllustration from "./assets/calm-workspace-illustration.png";
import {
  createNote,
  getCategories,
  readNotesByCategory,
  type Note,
} from "./api/notes";

type MoodOption = "calm" | "inspired" | "reflective" | "grateful" | "neutral";

type Metric = {
  value: string;
  label: string;
};

type NoteCategory = {
  name: string;
  count: number;
  description: string;
  highlight: string;
  accent: string;
};

const features = [
  {
    title: "轻松捕捉灵感",
    description:
      "使用一键输入与语音记录，在任何设备上保存瞬时想法，并自动补齐标签与上下文。",
    icon: "🪄",
    accent: "#F0E6D9",
  },
  {
    title: "语义链接网络",
    description:
      "通过智能链接生成器串联相关概念，构建出属于你的第二大脑知识图谱。",
    icon: "🕸️",
    accent: "#E3F2EF",
  },
  {
    title: "回顾心流仪表板",
    description:
      "以时间轴与情绪热力图呈现学习轨迹，帮助你在安静的节奏中保持持续成长。",
    icon: "📅",
    accent: "#F4EAF5",
  },
];

const socialLinks = [
  {
    badge: "X",
    label: "专注力线程",
    platform: "X / Twitter",
    href: "https://x.com/",
    description: "每日分享知识管理实践与阅读感悟。",
  },
  {
    badge: "in",
    label: "灵感日刊",
    platform: "Instagram",
    href: "https://www.instagram.com/",
    description: "用柔和插画记录每周主题与写作片段。",
  },
  {
    badge: "YT",
    label: "学习温室",
    platform: "YouTube",
    href: "https://www.youtube.com/",
    description: "十分钟工作流演示，演示如何在宁静节奏中整理知识。",
  },
];

const moodOptions: Array<{ label: string; value: MoodOption }> = [
  { label: "宁静", value: "calm" },
  { label: "灵感", value: "inspired" },
  { label: "反思", value: "reflective" },
  { label: "感恩", value: "grateful" },
  { label: "平和", value: "neutral" },
];

const noteTemplatePlaceholders = {
  title: "在此输入主题标题，例如：晨间书写体会",
  content:
    "写下你当前关注的问题、灵感片段或阅读摘录。可以使用要点、引用与自省段落组合成一篇笔记。",
  tags: "输入多个标签，用逗号分隔，例如：晨间书写, 灵感捕捉",
};

const CATEGORY_DEFINITIONS: Array<{
  name: string;
  description: string;
  highlight: string;
  accent: string;
}> = [
  {
    name: "深度阅读索引",
    description: "整合书摘、论文与批注，自动串联关键词，轻松建立跨书籍的洞见。",
    highlight: "跨书籍洞见",
    accent: "#F0E6D9",
  },
  {
    name: "研究灵感库",
    description: "捕捉实验灵感、访谈记录与原型照片，让创意与证据在同一处沉淀。",
    highlight: "创意沉淀",
    accent: "#E3F2EF",
  },
  {
    name: "自我反思日志",
    description: "每日三问与心情曲线，帮助你保持觉察，并记录微小而真实的成长。",
    highlight: "每日觉察",
    accent: "#F4EAF5",
  },
  {
    name: "生活拾光集",
    description: "收藏日常的温柔瞬间，透过照片、语句与声音刷新生活灵感。",
    highlight: "温柔日常",
    accent: "#E9F1F4",
  },
];

const ACCENT_FALLBACKS = ["#E9F1F4", "#F4EAF5", "#E3F2EF", "#F0E6D9", "#FDEEE2"];

let hasSeeded = false;

function ensureSeedNotes() {
  if (hasSeeded) return;
  if (getCategories().length > 0) {
    hasSeeded = true;
    return;
  }

  const sampleNotes: Array<{
    title: string;
    content: string;
    category: string;
    tags: string[];
    mood: MoodOption;
  }> = [
    {
      title: "晨读：《被讨厌的勇气》札记",
      content:
        "记录书中关于自我接纳的三条关键论点，并结合最近的项目沟通经历，思考勇敢表达真实需求的策略。",
      category: "深度阅读索引",
      tags: ["心理学", "自我成长"],
      mood: "reflective",
    },
    {
      title: "夜间散步的 5 个灵感",
      content:
        "捕捉散步途中想到的服务设计改进点，并附上两张手机快照；准备明天与团队复盘。",
      category: "研究灵感库",
      tags: ["服务设计", "观察记录"],
      mood: "inspired",
    },
    {
      title: "Day 18 晨间书写",
      content:
        "以“今天最感恩的三件事”为起点，梳理昨晚的情绪波动，并规划上午的专注任务块。",
      category: "自我反思日志",
      tags: ["晨间书写", "感恩清单"],
      mood: "grateful",
    },
    {
      title: "雨后植物的色卡",
      content:
        "记录窗台植物被雨水冲刷后的色彩变化，并为下周的插画配色备份三个主色调。",
      category: "生活拾光集",
      tags: ["色彩", "插画"],
      mood: "calm",
    },
  ];

  sampleNotes.forEach((note) => {
    createNote({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
      mood: note.mood,
    });
  });

  hasSeeded = true;
}

function formatNumber(value: number) {
  return value.toLocaleString("zh-CN");
}

function resolveCategories(): NoteCategory[] {
  ensureSeedNotes();

  const categoriesFromStore = getCategories();
  const baseMap = new Map<string, NoteCategory>();

  CATEGORY_DEFINITIONS.forEach((definition) => {
    baseMap.set(definition.name, {
      name: definition.name,
      description: definition.description,
      highlight: definition.highlight,
      accent: definition.accent,
      count: 0,
    });
  });

  categoriesFromStore.forEach((category, index) => {
    const existing = baseMap.get(category.name);
    if (existing) {
      existing.count = category.count;
    } else {
      baseMap.set(category.name, {
        name: category.name,
        description: "为这个主题写下第一条灵感吧。",
        highlight: "新主题",
        accent: ACCENT_FALLBACKS[index % ACCENT_FALLBACKS.length],
        count: category.count,
      });
    }
  });

  const ordered: NoteCategory[] = [];
  CATEGORY_DEFINITIONS.forEach((definition) => {
    const item = baseMap.get(definition.name);
    if (item) {
      ordered.push(item);
    }
  });

  baseMap.forEach((item) => {
    if (!CATEGORY_DEFINITIONS.some((definition) => definition.name === item.name)) {
      ordered.push(item);
    }
  });

  return ordered;
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F0EB] text-[#2F3A3D] antialiased">
      <TopNav />
      {children}
      <FooterSection />
    </div>
  );
}

function TopNav() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-b-3xl border border-white/40 bg-white/70 px-6 py-4 shadow-sm">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-[#2F3A3D]">
          Mindful Knowledge Studio
        </Link>
        <nav className="flex items-center gap-3 text-xs font-medium text-[#5E7D7E]">
          <Link
            to="/"
            className={`rounded-full px-4 py-2 transition-all duration-200 ${
              isHome ? "bg-[#5E7D7E] text-white shadow-md" : "bg-white/60 hover:-translate-y-0.5 hover:shadow"
            }`}
          >
            主页
          </Link>
          <Link
            to="/notes"
            className={`rounded-full px-4 py-2 transition-all duration-200 ${
              location.pathname.startsWith("/notes") && location.pathname !== "/notes/new"
                ? "bg-[#5E7D7E] text-white shadow-md"
                : "bg-white/60 hover:-translate-y-0.5 hover:shadow"
            }`}
          >
            分类笔记
          </Link>
          <Link
            to="/notes/new"
            className={`rounded-full px-4 py-2 transition-all duration-200 ${
              location.pathname === "/notes/new"
                ? "bg-[#5E7D7E] text-white shadow-md"
                : "bg-white/60 hover:-translate-y-0.5 hover:shadow"
            }`}
          >
            新建笔记
          </Link>
        </nav>
      </div>
    </header>
  );
}

function CategoriesGlimpse({ categories }: { categories: NoteCategory[] }) {
  if (!categories.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.slice(0, 3).map((category) => (
        <Link
          key={category.name}
          to={`/notes/category/${encodeURIComponent(category.name)}`}
          className="group rounded-3xl border border-white/50 bg-white/70 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#5E7D7E]">{category.name}</span>
            <span className="text-xs uppercase tracking-[0.2em] text-[#9AA9AA]">
              {category.count > 0 ? `${category.count} 条笔记` : category.highlight}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#4B5A60]">
            {category.description}
          </p>
        </Link>
      ))}
    </div>
  );
}

function HeroSection({
  categories,
  metrics,
}: {
  categories: NoteCategory[];
  metrics: Metric[];
}) {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#F9F6F0] via-[#F4F0EB] to-[#E7DED4]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-32 -right-28 h-96 w-96 rounded-full bg-[#BFD8D5]/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-[#DFC9B8]/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pt-20 pb-24 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#5E7D7E]">
              <span className="h-2 w-2 rounded-full bg-[#5E7D7E]" />
              Mindful Archive
            </span>
            <Link
              to="/notes"
              className="hidden rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-medium text-[#5E7D7E] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:inline-flex"
            >
              浏览全部分类
            </Link>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-[3.25rem]">
              宁静的个人知识花园
            </h1>
            <p className="text-base leading-relaxed text-[#4B5A60] sm:text-lg">
              以柔和的视觉与清晰的结构整理灵感，把书摘、想法与反思温柔地收拢在一起，让你的知识体系在呼吸之间缓慢成长。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/notes/new")}
              className="group inline-flex items-center justify-center rounded-full bg-[#5E7D7E] px-8 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              开始整理
            </button>
            <Link
              to="/notes"
              className="inline-flex items-center justify-center rounded-full border border-[#5E7D7E]/50 bg-white/80 px-8 py-3 text-sm font-medium text-[#5E7D7E] transition-all duration-200 hover:border-[#5E7D7E] hover:text-[#2F3A3D]"
            >
              查看导览
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/60 bg-white/70 p-4 text-left shadow-sm"
              >
                <p className="text-2xl font-semibold text-[#2F3A3D]">{metric.value}</p>
                <p className="mt-2 text-[0.7rem] uppercase tracking-[0.18em] text-[#5E7D7E]">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          <CategoriesGlimpse categories={categories} />
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[3rem] bg-white/55 shadow-[0_40px_120px_-40px_rgba(94,125,126,0.45)] backdrop-blur" />
          <img
            src={heroIllustration}
            alt="柔和插画展示安静的写作空间与自然元素"
            loading="lazy"
            className="relative mx-auto w-full max-w-lg rounded-[2.5rem] border border-white/80 shadow-lg"
          />
          <div className="absolute -bottom-12 left-1/2 w-64 -translate-x-1/2 rounded-3xl bg-[#2F3A3D] px-6 py-5 text-sm text-white shadow-xl">
            <p className="font-semibold">今日笔记建议</p>
            <p className="mt-1 text-xs text-white/80">
              为「深度阅读索引」主题补充两个案例，并添加心情标签，保持灵感流动。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">为专注打造的知识体验</h2>
          <p className="mt-2 text-base text-[#4B5A60]">
            用极简的界面支持深思，把每一次记录都变成与自己对话的瞬间。
          </p>
        </div>
        <p className="text-sm text-[#7A8B90]">
          所有数据自动备份，可在桌面、平板与手机间无缝切换。
        </p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
              style={{ backgroundColor: feature.accent }}
              aria-hidden="true"
            >
              {feature.icon}
            </span>
            <h3 className="mt-4 text-xl font-semibold text-[#2F3A3D]">{feature.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#4B5A60]">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function KnowledgeGreenhouse({ categories }: { categories: NoteCategory[] }) {
  return (
    <section id="library" className="bg-white/60 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="text-3xl font-semibold text-[#2F3A3D]">你的知识温室</h2>
            <p className="text-base text-[#4B5A60]">
              分区展示最重要的项目，标签、进度与灵感提示一目了然。每一张卡片都是你个人知识旅程中的一个静谧站点。
            </p>
          </div>
          <div className="rounded-3xl border border-[#E8DFD4] bg-[#F8F4EE]/70 px-6 py-5 text-sm text-[#5E7D7E] shadow-sm">
            <p className="font-medium">提示：</p>
            <p className="mt-1 leading-relaxed">
              每周五自动生成「回顾计划」，提醒你复盘关键标签与尚未链接的内容页，避免灵感散落。
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/notes/category/${encodeURIComponent(category.name)}`}
              className="group flex h-full flex-col justify-between rounded-3xl border border-[#E8DFD4] bg-white/90 px-6 py-7 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-[#2F3A3D]">{category.name}</h3>
                  <span
                    className="rounded-full px-3 py-1 text-[0.7rem] font-medium text-[#5E7D7E]"
                    style={{ backgroundColor: category.accent }}
                  >
                    {category.count > 0 ? `${category.count} 条笔记` : category.highlight}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#4B5A60]">{category.description}</p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#5E7D7E]">
                进入主题 <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-[#2F3A3D]">保持灵感的温柔流动</h2>
          <p className="mt-3 text-base text-[#4B5A60]">
            加入我们的社群触角，在不同平台上同步获取笔记灵感、流程演示与写作片段。
          </p>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {socialLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h满 items-start gap-4 rounded-3xl border border白/60 bg白/80 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:bg白 hover:shadow-lg"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E2F0EE] text-base font-semibold text-[#2F3A3D]">
                  {link.badge}
                </span>
                <div className="space-y-1 text-left">
                  <p className="text-sm font-semibold text-[#2F3A3D]">{link.label}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#7A8B90]">{link.platform}</p>
                  <p className="pt-1 text-sm leading-relaxed text[#4B5A60]">{link.description}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="border-t border白/60 bg白/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-[#66757B] sm:flex-row sm:items-center sm:justify-between">
        <p>© 2025 Mindful Knowledge Studio</p>
        <p>以安静的节奏培育你的第二大脑。</p>
      </div>
    </footer>
  );
}

function HomePage() {
  const location = useLocation();
  const categories = useMemo(() => resolveCategories(), [location.key]);
  const totalNotes = useMemo(
    () => categories.reduce((sum, category) => sum + category.count, 0),
    [categories]
  );

  const metrics = useMemo<Metric[]>(
    () => [
      { value: formatNumber(totalNotes), label: "已整理笔记" },
      { value: formatNumber(categories.length), label: "知识主题" },
      { value: formatNumber(moodOptions.length), label: "心情模板" },
    ],
    [categories.length, totalNotes]
  );

  return (
    <PageShell>
      <HeroSection categories={categories} metrics={metrics} />
      <FeaturesSection />
      <KnowledgeGreenhouse categories={categories} />
      <SocialSection />
    </PageShell>
  );
}

function NotesLibraryPage() {
  const location = useLocation();
  const categories = useMemo(() => resolveCategories(), [location.key]);

  const categorySummaries = useMemo(
    () =>
      categories.map((category, index) => {
        const { data } = readNotesByCategory(category.name, { limit: 2 });
        return {
          ...category,
          sampleNotes: data.notes,
          accentIndex: index,
        };
      }),
    [categories, location.key]
  );

  return (
    <PageShell>
      <section className="relative overflow-hidden py-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-[#E7DED4] via-transparent to-transparent"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg白/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text[#5E7D7E]">
            Notes Library
          </span>
          <h1 className="text-3xl font-semibold sm:text-4xl">分类笔记陈列室</h1>
          <p className="max-w-2xl text-base leading-relaxed text-[#52656A]">
            在这里检索所有主题的笔记卡片，感受不同灵感在宁静氛围中缓慢生长。点击任意卡片，即刻穿梭至对应的知识温室。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="rounded-full border border-[#5E7D7E]/40 bg白/80 px-5 py-2 text-xs font-medium text[#5E7D7E] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              返回主页
            </Link>
            <Link
              to="/notes/new"
              className="rounded-full bg[#5E7D7E] px-5 py-2 text-xs font-medium text白 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              新建笔记
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-12 max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {categorySummaries.map((category) => (
              <Link
                key={category.name}
                to={`/notes/category/${encodeURIComponent(category.name)}`}
                className="group flex h-full flex-col justify-between rounded-3xl border border白/60 bg白/85 p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold text[#2F3A3D]">{category.name}</h3>
                    <span
                      className="rounded-full px-3 py-1 text-[0.7rem] font-medium text[#5E7D7E]"
                      style={{ backgroundColor: category.accent }}
                    >
                      {category.count > 0 ? `${category.count} 条笔记` : category.highlight}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text[#4B5A60]">{category.description}</p>
                </div>
                {category.sampleNotes.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {category.sampleNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-2xl border border[#E8DFD4] bg白/70 px-4 py-3 text-left"
                      >
                        <p className="text-sm font-medium text[#2F3A3D]">{note.title}</p>
                        <p className="mt-1 text-xs text[#6B7C80]">
                          {note.content.length > 96
                            ? `${note.content.slice(0, 96)}…`
                            : note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text[#7A8B90]">为这个主题写下第一条笔记吧。</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function CategoryDetailPage() {
  const { categoryName } = useParams();
  const decodedName = decodeURIComponent(categoryName ?? "");
  const navigate = useNavigate();
  const { data } = readNotesByCategory(decodedName, { limit: 1000 });
  const notes = data.notes;

  return (
    <PageShell>
      <section className="relative overflow-hidden py-16">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#E7DED4] via-transparent to-transparent"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg白/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text[#5E7D7E]">
                {decodedName}
              </span>
              <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{decodedName}</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text[#4B5A60]">
                这里汇集了与该主题相关的所有笔记，可作为继续深入探索或回顾整理的起点。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="rounded-full border border[#5E7D7E]/40 bg白/80 px-4 py-2 text-xs font-medium text[#5E7D7E] transition-all duration-200 hover:-translate-y-0.5 hover:shadow"
              >
                返回上一页
              </button>
              <Link
                to="/notes/new"
                className="rounded-full bg[#5E7D7E] px-4 py-2 text-xs font-medium text白 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                新建笔记
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {notes.length > 0 ? (
              notes.map((note) => <NoteCard key={note.id} note={note} />)
            ) : (
              <div className="rounded-3xl border border-white/60 bg白/80 p-8 text-center shadow-sm">
                <p className="text-sm text[#5E7D7E]">暂无记录，写下第一篇笔记，开启主题探索。</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <article className="group flex h-full flex-col justify-between rounded-3xl border border[#E8DFD4] bg白/90 p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="max-w-[75%] text-lg font-semibold text[#2F3A3D]">{note.title}</h3>
          {note.mood && (
            <span className="rounded-full bg[#EAF2F0] px-3 py-1 text-[0.7rem] font-medium text[#5E7D7E]">
              {moodOptions.find((option) => option.value === note.mood)?.label ?? note.mood}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text[#4B5A60]">
          {note.content.length > 180 ? `${note.content.slice(0, 180)}…` : note.content}
        </p>
      </div>
      {note.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg[#E2F0EE] px-3 py-1 text-xs font-medium text[#5E7D7E]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text[#9AA9AA]">
        {note.createdAt.toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}
      </p>
    </article>
  );
}

function NewNotePage() {
  const navigate = useNavigate();
  const categories = resolveCategories();
  const [form, setForm] = useState(() => ({
    title: "",
    category: categories[0]?.name ?? "",
    tags: "",
    content: "",
    mood: moodOptions[0].value,
  }));

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedTitle = form.title.trim();
    const trimmedCategory = form.category.trim();
    const trimmedContent = form.content.trim();

    if (!trimmedTitle || !trimmedCategory) {
      setError("请填写标题与分类，便于后续整理。");
      return;
    }

    setLoading(true);

    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const response = createNote({
        title: trimmedTitle,
        category: trimmedCategory,
        content: trimmedContent,
        tags,
        mood: form.mood,
      });

      setForm((prev) => ({
        ...prev,
        title: "",
        content: "",
        tags: "",
      }));

      navigate(`/notes/category/${encodeURIComponent(response.data.category)}`);
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "笔记创建失败，请稍后再试。"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <section className="relative overflow-hidden py-16">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#E7DED4] via-transparent to-transparent"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#5E7D7E]">
                Note Template
              </p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">宁静笔记模板</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#4B5A60]">
                以呼吸般的节奏整理思考：输入标题、选择分类，记录文字、灵感与心情。提交后我们会自动归档至对应主题。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/notes"
                className="rounded-full border border-[#5E7D7E]/40 bg白/80 px-4 py-2 text-xs font-medium text[#5E7D7E] transition-all duration-200 hover:-translate-y-0.5 hover:shadow"
              >
                返回分类页
              </Link>
              <Link
                to="/"
                className="rounded-full bg[#5E7D7E] px-4 py-2 text-xs font-medium text白 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                回到主页
              </Link>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-6 rounded-3xl border border-white/70 bg白/80 p-8 shadow-sm backdrop-blur"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text[#5E7D7E]">
                标题
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder={noteTemplatePlaceholders.title}
                  className="rounded-2xl border border白/60 bg白 px-4 py-3 text-sm text[#2F3A3D] shadow-inner outline-none transition focus:border[#5E7D7E]"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text[#5E7D7E]">
                分类
                <input
                  list="note-category-list"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                  placeholder="例如：晨间书写"
                  className="rounded-2xl border border白/60 bg白 px-4 py-3 text-sm text[#2F3A3D] shadow-inner outline-none transition focus:border[#5E7D7E]"
                  required
                />
                <datalist id="note-category-list">
                  {categories.map((category) => (
                    <option key={category.name} value={category.name} />
                  ))}
                </datalist>
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm text[#5E7D7E]">
              主要内容
              <textarea
                value={form.content}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, content: event.target.value }))
                }
                placeholder={noteTemplatePlaceholders.content}
                rows={8}
                className="rounded-2xl border border白/60 bg白 px-4 py-3 text-sm leading-relaxed text[#2F3A3D] shadow-inner outline-none transition focus:border[#5E7D7E]"
              />
            </label>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text[#5E7D7E]">
                标签
                <input
                  value={form.tags}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, tags: event.target.value }))
                  }
                  placeholder={noteTemplatePlaceholders.tags}
                  className="rounded-2xl border border白/60 bg白 px-4 py-3 text-sm text[#2F3A3D] shadow-inner outline-none transition focus:border[#5E7D7E]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text[#5E7D7E]">
                心情
                <select
                  value={form.mood}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      mood: event.target.value as MoodOption,
                    }))
                  }
                  className="rounded-2xl border border白/60 bg白 px-4 py-3 text-sm text[#2F3A3D] shadow-inner outline-none transition focus:border[#5E7D7E]"
                >
                  {moodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && (
              <p className="rounded-2xl bg[#FCE8E8] px-4 py-3 text-sm text-[#B76D6D]">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg[#5E7D7E] px-8 py-3 text-sm font-medium text白 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "记录中…" : "保存笔记"}
              </button>
              <p className="text-xs text[#7A8B90]">
                小提示：我们会自动标记时间戳，并同步到分类页。
              </p>
            </div>
          </form>
        </div>
      </section>
    </PageShell>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/notes" element={<NotesLibraryPage />} />
        <Route path="/notes/new" element={<NewNotePage />} />
        <Route path="/notes/category/:categoryName" element={<CategoryDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
