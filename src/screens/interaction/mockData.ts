export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Question {
  id: string;
  author: User;
  createdAt: string;
  title: string;
  body: string;
  tags: string[];
  answerCount: number;
}

export interface Answer {
  id: string;
  questionId: string;
  author: User;
  createdAt: string;
  body: string;
  likes: number;
}

export interface News {
  id: string;
  source: string;
  category: string;
  createdAt: string;
  title: string;
  summary: string;
  body: string;
  image?: string;
  isRead: boolean;
}

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  text: string;
  image?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  createdAt: string;
  text: string;
}

const USERS: Record<string, User> = {
  u1: { id: 'u1', name: 'رضا نادری', role: 'دبیر علوم تجربی', avatar: 'https://i.pravatar.cc/150?u=1' },
  u2: { id: 'u2', name: 'علی رضایی', role: 'دبیر علوم', avatar: 'https://i.pravatar.cc/150?u=2' },
  u3: { id: 'u3', name: 'مریم احمدی', role: 'معلم ابتدایی', avatar: 'https://i.pravatar.cc/150?u=3' },
  u4: { id: 'u4', name: 'محمد کاظمی', role: 'دبیر ادبیات', avatar: 'https://i.pravatar.cc/150?u=4' },
  u5: { id: 'u5', name: 'سارا محمدی', role: 'دبیر ریاضی', avatar: 'https://i.pravatar.cc/150?u=5' },
  u6: { id: 'u6', name: 'سمیه رضایی', role: 'دبیر زبان', avatar: 'https://i.pravatar.cc/150?u=6' },
  u7: { id: 'u7', name: 'نرگس حسینی', role: 'معلم ابتدایی', avatar: 'https://i.pravatar.cc/150?u=7' },
};

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    author: USERS.u1,
    createdAt: '۲ ساعت پیش',
    title: 'روش تدریس علوم تجربی',
    body: 'برای تدریس فصل ۶ علوم تجربی در پایه هفتم چه روش‌هایی پیشنهاد می‌کنید؟ آیا روش آزمایشگاهی برای این فصل مناسب‌تر است یا تئوری؟',
    tags: ['علوم تجربی', 'پایه هفتم', 'روش تدریس', 'آموزشی'],
    answerCount: 12,
  },
  {
    id: 'q2',
    author: USERS.u2,
    createdAt: '۵ ساعت پیش',
    title: 'نمونه سوالات نوبت دوم',
    body: 'آیا امکان دارد نمونه سوالات نوبت دوم پایه نهم را در اختیار همکاران قرار دهیم؟ به دنبال سوالات استاندارد و مفهومی هستم.',
    tags: ['نمونه سوال', 'پایه نهم', 'امتحانات', 'ارزشیابی'],
    answerCount: 8,
  },
  {
    id: 'q3',
    author: USERS.u3,
    createdAt: '۱ روز پیش',
    title: 'دانش‌آموزان کم‌تلاش',
    body: 'چطور می‌توانم دانش‌آموزان کم‌تلاش کلاس را بهتر به درس علاقه‌مند کنم؟',
    tags: ['مدیریت کلاس', 'رفتار دانش‌آموز', 'کلاسداری'],
    answerCount: 15,
  },
  {
    id: 'q4',
    author: USERS.u4,
    createdAt: '۱ روز پیش',
    title: 'طراحی آزمون استاندارد',
    body: 'برای طراحی یک آزمون استاندارد برای پایه هشتم چه نکاتی را باید رعایت کنیم؟ بارم‌بندی چطور باید باشد؟',
    tags: ['ارزشیابی', 'آزمون', 'پایه هشتم'],
    answerCount: 6,
  },
  {
    id: 'q5',
    author: USERS.u5,
    createdAt: '۲ روز پیش',
    title: 'آموزش کسرها',
    body: 'برای آموزش مفهوم کسرها در پایه چهارم چه فعالیت عملی پیشنهاد می‌کنید؟',
    tags: ['ابتدایی', 'ریاضی', 'روش تدریس', 'آموزشی'],
    answerCount: 21,
  },
  {
    id: 'q6',
    author: USERS.u7,
    createdAt: '۳ روز پیش',
    title: 'مدیریت زمان تصحیح اوراق',
    body: 'بهترین روش برای مدیریت زمان هنگام تصحیح تعداد زیادی برگه امتحانی چیست؟',
    tags: ['مدیریت زمان', 'امتحانات', 'ارزشیابی'],
    answerCount: 9,
  },
  {
    id: 'q7',
    author: USERS.u6,
    createdAt: '۴ روز پیش',
    title: 'آموزش لغات زبان انگلیسی',
    body: 'چگونه دانش‌آموزان را به حفظ کردن و یادگیری لغات جدید زبان ترغیب کنیم؟',
    tags: ['زبان انگلیسی', 'روش تدریس', 'سایر'],
    answerCount: 14,
  },
];

export const MOCK_ANSWERS: Answer[] = [
  {
    id: 'a1',
    questionId: 'q1',
    author: USERS.u4,
    createdAt: '۱ ساعت پیش',
    body: 'من برای این فصل از ویدیوهای کوتاه آموزشی استفاده می‌کنم و بعد از هر بخش یک فعالیت عملی انجام می‌دهیم. معمولاً خیلی بهتر جواب می‌دهد.',
    likes: 18,
  },
  {
    id: 'a2',
    questionId: 'q1',
    author: USERS.u6,
    createdAt: '۴۵ دقیقه پیش',
    body: 'من هم از فعالیت‌های گروهی استفاده کردم. اگر کلاس تعداد زیادی دانش‌آموز دارد، تقسیم کردن آنها به گروه‌های کوچک خیلی کمک می‌کند.',
    likes: 12,
  },
  {
    id: 'a3',
    questionId: 'q5',
    author: USERS.u7,
    createdAt: '۱ روز پیش',
    body: 'استفاده از شکلات یا پیتزای مقوایی همیشه جواب میده! بچه‌ها خیلی سریع درک می‌کنن وقتی که بتونن بصورت فیزیکی کسرها رو ببینن.',
    likes: 34,
  },
];

export const MOCK_NEWS: News[] = [
  {
    id: 'n1',
    source: 'وزارت آموزش و پرورش',
    category: 'ضمن خدمت',
    createdAt: '۳ ساعت پیش',
    title: 'آخرین جزئیات درباره زمان خدمت ضمن خدمت ویژه معلمان از هفته آینده',
    summary: 'به اطلاع فرهنگیان می‌رسد جزئیات جدید دوره‌های ضمن خدمت فرهنگیان از تاریخ...',
    body: 'متن کامل خبر در اینجا قرار می‌گیرد که شامل توضیحات مفصل بخشنامه‌ها و شرایط شرکت در دوره‌ها می‌باشد.',
    isRead: false,
  },
  {
    id: 'n2',
    source: 'اداره کل آموزش و پرورش استان',
    category: 'آموزشی',
    createdAt: '۵ ساعت پیش',
    title: 'برگزاری جشنواره آموزشی با محوریت روش‌های نوین تدریس',
    summary: 'جشنواره سالانه الگوهای برتر تدریس در مرحله استانی با حضور معلمان برگزیده برگزار خواهد شد.',
    body: 'معلمان علاقه‌مند می‌توانند برای شرکت در این جشنواره طرح درس‌های خود را تا پایان ماه به دبیرخانه ارسال کنند.',
    isRead: true,
  },
  {
    id: 'n3',
    source: 'معاونت آموزش',
    category: 'تقویم آموزشی',
    createdAt: '۱ روز پیش',
    title: 'ابلاغ تقویم آموزشی سال تحصیلی جدید',
    summary: 'تقویم اجرایی و آموزشی مدارس سراسر کشور به ادارات آموزش و پرورش ابلاغ شد.',
    body: 'جزئیات تعطیلات، امتحانات نوبت اول و دوم، و برنامه‌های ویژه مدارس در این تقویم گنجانده شده است.',
    isRead: false,
  },
  {
    id: 'n4',
    source: 'اداره کل منابع انسانی',
    category: 'حقوق و مزایا',
    createdAt: '۲ روز پیش',
    title: 'اطلاعیه پرداخت حق‌التدریس معلمان',
    summary: 'معوقات حق‌التدریس مربوط به سه ماهه اول سال تحصیلی طی هفته جاری به حساب معلمان واریز خواهد شد.',
    body: 'منابع مالی مورد نیاز تامین شده و طبق لیست ارسالی از مناطق پرداختی‌ها انجام می‌شود.',
    isRead: true,
  },
  {
    id: 'n5',
    source: 'مرکز سنجش آموزش',
    category: 'آزمون‌ها',
    createdAt: '۳ روز پیش',
    title: 'تغییرات جدید در امتحانات نهایی پایه دهم و یازدهم',
    summary: 'بر اساس مصوبه جدید شورای عالی آموزش و پرورش، شیوه طراحی سوالات تغییر خواهد کرد.',
    body: 'سوالات امسال بر پایه مفاهیم عمیق و کاربردی طراحی شده و از حفظیات صرف فاصله خواهد گرفت.',
    isRead: false,
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    author: USERS.u5,
    createdAt: '۲ ساعت پیش',
    text: 'امروز با دانش‌آموزانم درباره کاربرد ریاضی در زندگی روزمره صحبت کردیم. تجربه جالبی بود و باعث شد خیلی از آنها ارتباط بیشتری با درس برقرار کنند.',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    likes: 42,
    comments: 7,
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'p2',
    author: USERS.u2,
    createdAt: '۵ ساعت پیش',
    text: 'کسی تجربه‌ای از استفاده از بازی‌های آموزشی در کلاس دارد؟ برای پایه‌های مختلف چه بازی‌هایی مناسب هستند؟',
    likes: 19,
    comments: 11,
    isLiked: true,
    isSaved: true,
  },
  {
    id: 'p3',
    author: USERS.u3,
    createdAt: '۱ روز پیش',
    text: 'کتابخانه مدرسه‌مون با همکاری انجمن اولیا و مربیان دوباره راه‌اندازی شد. امیدوارم بچه‌ها امسال بیشتر با کتاب دوست بشن.',
    likes: 31,
    comments: 6,
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'p4',
    author: USERS.u4,
    createdAt: '۱ روز پیش',
    text: 'تدریس اشعار حافظ به دانش‌آموزان همیشه برای من لذت‌بخش بوده. امروز بچه‌ها خودشان داوطلب شدند تا ابیاتی را در کلاس دکلمه کنند.',
    likes: 56,
    comments: 14,
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'p5',
    author: USERS.u1,
    createdAt: '۲ روز پیش',
    text: 'برای آزمایشگاه علوم فردا یک سری وسایل ساده تهیه کردم. امیدوارم این روش یادگیری تجربی باعث ماندگاری بهتر مطالب تو ذهن دانش‌آموزان بشه.',
    likes: 24,
    comments: 3,
    isLiked: false,
    isSaved: false,
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    postId: 'p1',
    author: USERS.u2,
    createdAt: '۱ ساعت پیش',
    text: 'چه ایده جالبی، من هم می‌خواهم این روش را در کلاس خودم امتحان کنم.',
  },
  {
    id: 'c2',
    postId: 'p1',
    author: USERS.u5,
    createdAt: '۴۵ دقیقه پیش',
    text: 'حتماً تجربه‌تون رو هم به اشتراک بذارید.',
  },
  {
    id: 'c3',
    postId: 'p2',
    author: USERS.u7,
    createdAt: '۳ ساعت پیش',
    text: 'برای بچه‌های ابتدایی بازی مار و پله با سوالات درسی خیلی جواب میده.',
  },
];
