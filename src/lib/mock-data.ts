export type MockUser = {
  id: string;
  username: string;
  name: string;
  age: number;
  city: string;
  avatar: string;
  bio?: string;
  isPrivate?: boolean;
  followers?: number;
  following?: number;
  posts?: number;
};

export type MockPost = {
  id: string;
  user: MockUser;
  image: string;
  /** URL do vídeo quando kind === "video" (mídia no Cloudflare R2/CDN). */
  video?: string;
  caption: string;
  likes: number;
  comments: number;
  date: string;
  liked?: boolean;
  saved?: boolean;
  kind?: "photo" | "video";
};

export type StoryMedia = {
  id: string;
  image: string; // poster / thumbnail
  mediaUrl?: string; // video URL if kind === "video"
  kind?: "image" | "video";
  startTime?: number; // video trim start (s)
  duration?: number; // capped video duration (s)
  createdAt: number; // ms epoch
  caption?: string;
  mentions?: string[]; // usernames tagged with @
};

export type MockStory = {
  id: string;
  user: MockUser;
  isOwn?: boolean;
  seen?: boolean;
  media: StoryMedia[];
};


export type ConversationRequest = {
  id: string;
  fromUser: MockUser;
  method: "chat" | "whatsapp";
  amount: number;
  createdAt: string;
  daysLeft: number;
};

export type ChatItem = {
  id: string;
  user: MockUser;
  lastMessage: string;
  time: string;
  unread: number;
};

const avatar = (seed: string) => `https://i.pravatar.cc/240?u=${seed}`;
const photo = (seed: string) => `https://picsum.photos/seed/${seed}/900/900`;

export const currentUser: MockUser = {
  id: "me",
  username: "voce",
  name: "Você",
  age: 27,
  city: "São Paulo, SP",
  avatar: avatar("voce-pinguim"),
  bio: "Explorando o Pinguim ✨",
};

export const users: MockUser[] = [
  { id: "u1", username: "maria.oliveira", name: "Maria", age: 22, city: "São Paulo, SP", avatar: avatar("maria"), bio: "Adorei conhecer novas pessoas e fazer novas amizades. ✨", isPrivate: false, followers: 1240, following: 312, posts: 18 },
  { id: "u2", username: "lil_lapisla", name: "Luiza", age: 24, city: "Rio de Janeiro, RJ", avatar: avatar("luiza"), isPrivate: true, followers: 842, following: 190, posts: 24, bio: "Só amigos próximos 💌" },
  { id: "u3", username: "lofti232", name: "Lofti", age: 26, city: "Curitiba, PR", avatar: avatar("lofti"), isPrivate: false, followers: 512, following: 220, posts: 9 },
  { id: "u4", username: "kenzoere", name: "Kenzo", age: 23, city: "Belo Horizonte, MG", avatar: avatar("kenzo"), isPrivate: true, followers: 331, following: 140, posts: 12 },
  { id: "u5", username: "photosbyen", name: "Enzo", age: 28, city: "Porto Alegre, RS", avatar: avatar("enzo"), isPrivate: false, followers: 2210, following: 410, posts: 42, bio: "Fotógrafo 📷 | Viagens" },
  { id: "u6", username: "monicamoras", name: "Mônica", age: 25, city: "Florianópolis, SC", avatar: avatar("monica"), isPrivate: false, followers: 987, following: 260, posts: 20, bio: "Mar, sol e café ☕" },
  { id: "u7", username: "julia.p", name: "Júlia", age: 21, city: "Salvador, BA", avatar: avatar("julia"), isPrivate: true, followers: 640, following: 300, posts: 15 },
];

const hoursAgo = (h: number) => Date.now() - h * 60 * 60 * 1000;
const storyMedia = (seed: string, count: number, baseHoursAgo: number): StoryMedia[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `${seed}-m${i}`,
    image: `https://picsum.photos/seed/${seed}-story-${i}/900/1600`,
    createdAt: hoursAgo(baseHoursAgo + i * 0.5),
    caption: i === 0 ? undefined : "Momento capturado ✨",
  }));

export const stories: MockStory[] = [
  { id: "s0", user: currentUser, isOwn: true, media: [] },
  { id: "s1", user: users[1], media: storyMedia("luiza", 2, 1) },
  { id: "s2", user: users[2], media: storyMedia("lofti", 1, 3), seen: true },
  { id: "s3", user: users[3], media: storyMedia("kenzo", 3, 5) },
  { id: "s4", user: users[4], media: storyMedia("enzo", 2, 8) },
  { id: "s5", user: users[5], media: storyMedia("monica", 1, 12), seen: true },

  { id: "s6", user: users[6], media: storyMedia("julia", 2, 20) },
];

export const posts: MockPost[] = [
  {
    id: "p1",
    user: users[0],
    image: photo("maria-post1"),
    caption: "Adorei conhecer novas pessoas e fazer novas amizades. ✨",
    likes: 1245,
    comments: 89,
    date: "12 de novembro",
  },
  {
    id: "p2",
    user: users[4],
    image: photo("enzo-post1"),
    caption: "Um final de tarde daqueles 🌇",
    likes: 842,
    comments: 34,
    date: "há 3 horas",
  },
  {
    id: "p3",
    user: users[5],
    image: photo("monica-post1"),
    caption: "Ilha do Campeche foi surreal 🐚",
    likes: 2103,
    comments: 156,
    date: "há 1 dia",
  },
  {
    id: "p4",
    user: users[6],
    image: photo("julia-post1"),
    caption: "Fim de semana em boas companhias 💛",
    likes: 578,
    comments: 21,
    date: "há 2 dias",
  },
];

export const conversationRequests: ConversationRequest[] = [
  { id: "r1", fromUser: users[3], method: "chat", amount: 4.97, createdAt: "há 2h", daysLeft: 30 },
  { id: "r2", fromUser: users[2], method: "whatsapp", amount: 4.97, createdAt: "há 1 dia", daysLeft: 29 },
  { id: "r3", fromUser: users[1], method: "chat", amount: 4.97, createdAt: "há 3 dias", daysLeft: 27 },
];

export const chats: ChatItem[] = [
  { id: "c1", user: users[0], lastMessage: "Oi! Adorei te conhecer 😊", time: "12:32", unread: 2 },
  { id: "c2", user: users[5], lastMessage: "Bora marcar aquele café?", time: "ontem", unread: 0 },
  { id: "c3", user: users[6], lastMessage: "Kkkk que doido!", time: "seg", unread: 0 },
];

export const wallet = {
  balance: 126.40,
  received: 184.70,
  withdrawn: 58.30,
  verified: true,
  minWithdraw: 50,
};

export const explorePosts: MockPost[] = Array.from({ length: 18 }).map((_, i) => ({
  id: `ex${i}`,
  user: users[i % users.length],
  image: photo(`explore-${i}`),
  caption: "",
  likes: 100 + i * 37,
  comments: 5 + i,
  date: "",
}));
