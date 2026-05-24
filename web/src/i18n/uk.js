export const uk = {
  appName: 'Calculator of Illusions',
  appTagline: 'Скільки таких, як я, в Україні',

  nav: {
    home: 'Калькулятор',
    methodology: 'Методологія'
  },

  controls: {
    sex: 'Стать',
    male: 'Чоловік',
    female: 'Жінка',
    ageRange: 'Вік, років',
    ageFrom: 'від',
    ageTo: 'до',
    heightMin: 'Зріст від, см',
    heightDisable: 'не важливо',
    incomeDecile: 'Дохід від децилю',
    incomeDecileDisable: 'не важливо',
    incomeDecileHint: 'ESS питає сукупний дохід усього домогосподарства, орієнтовно від ',
    educationMin: 'Освіта',
    educationBuckets: {
      any: 'Не важливо',
      basic: 'Базова',
      vocational: 'Профтех',
      higher: 'Вища'
    },
    flags: {
      smokesNo: 'Не курить',
      moderateAlc: 'П\'є помірно або взагалі',
      noKidsHome: 'Немає своїх дітей <18 вдома',
      notMarried: 'Не у шлюбі або партнерстві'
    },
    choices: {
      any: 'Не важливо',
      politicsLabel: 'Політика',
      politicsLeft: 'Лівий',
      politicsRight: 'Правий',
      sportyLabel: 'Спорт',
      sportyYes: 'Спортивний',
      sportyNo: 'Не спортивний',
      religiousLabel: 'Релігійність',
      religiousYes: 'Релігійний',
      religiousNo: 'Не релігійний',
      languageLabel: 'Мова вдома',
      languageUkr: 'Українська',
      languageRus: 'Російська',
      languageOther: 'Інша'
    }
  },

  result: {
    pretitle: 'У підконтрольній території',
    suffix: 'людей відповідають твоїм критеріям',
    emptyPretitle: 'Базова чисельність',
    emptyHint: '↓ Додай критерії нижче, щоб звузити вибірку',
    ofTotal: 'з',
    ci: '95% CI',
    formula: 'Формула',
    formulaLabel: 'joint × зріст',
    decomposition: 'Який критерій найбільше звужує',
    decompositionHint: 'Якщо прибрати критерій — частка зросте до:',
    copy: 'Скопіювати посилання',
    copied: 'Скопійовано ✓',
    lowN: 'У ESS у твоєму статево-віковому вікні всього {n} респондентів. CI дуже широкий — інтерпретуй з обережністю.',
    zeroN: 'У ESS немає респондентів у твоєму статево-віковому вікні. Розшир діапазон віку.'
  },

  badge: {
    label: 'Дані:',
    essTpl: 'ESS {wave}, n={n}, {year}',
    cohortTpl: 'Чисельність: Інст. демографії, {year}',
    heightTpl: 'Зріст: NCD-RisC, {year}',
    todoYear: '????'
  },


  mock: {
    demoTitle: 'DEMO DATA',
    demoBody: 'Дані синтетичні. Це макет для розробки UI. Замінюй через ',
    demoCode: 'Rscript prep/build.R',
    partialTitle: 'ЧАСТКОВО МОК',
    partialBody: 'ESS — реальна вибірка. Зріст, чисельність когорт і дохідні децилі — поки що плейсхолдер. Деталі — ',
    partialLink: 'на сторінці методології'
  }
};
