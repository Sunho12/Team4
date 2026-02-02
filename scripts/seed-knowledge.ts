import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiKey })

const knowledgeDocuments = [
  {
    content: '법인 신규가입 대표자 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '법인',
        organization: ['상장법인', '비상장법인', '공공법인'],
        applicant: '대표자',
      },

      documents: {
        select: 1,
        options: [
          [
            '법인 인감증명서',
            '사업자등록증 사본 또는 원본',
            '대표자 신분증',
          ],
          [
            '대표자 신분증',
            '사업자등록증 원본',
          ],
          [
            '대표자 신분증',
            '등기사항 전부증명서(현재사항) 사본 또는 원본',
          ],
        ],
      },

      notes: [
        '공동대표인 경우 공동대표 전원 신청 필요',
        '국세청 홈택스 컬러 출력본은 원본 인정',
      ],
    },
  },
  {
    content: '장애법인 신규가입 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '법인',
        organization: '장애법인',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '법인 인감증명서',
            '위임장(법인인감날인)',
            '사업자등록증 사본 또는 원본',
            '대리인 신분증',
          ],
          [
            '위임공문(대표자 또는 기관장명)',
            '사업자등록증 사본 또는 원본',
            '대리인 신분증',
          ],
        ],
      },

      notes: [
        '복지할인 등록 시 복지법 또는 아동복지법에 의한 사회복지법인 설립 인·허가증 추가 필요',
        '사회복지법인 설립 인·허가증은 장애인복지법 또는 아동복지법에 의한 경우만 인정',
        '국세청 홈택스 컬러 출력본은 원본으로 인정',
      ],
    },
  },
  {
    content: '특수학교 신규가입 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '법인',
        organization: '특수학교',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '법인 인감증명서',
            '위임장(법인 인감날인)',
            '학교설립 인가서(학칙사본) 사본 또는 원본',
          ],
          [
            '위임공문(법인명의)',
            '학교설립 인가서(학칙사본) 사본 또는 원본',
            '대리인 신분증',
          ],
        ],
      },

      notes: [
        '국세청 홈택스 컬러 출력본은 원본으로 인정',
      ],
    },
  },
  {
    content: '국가기관 신규가입 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '법인',
        organization: '국가기관',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '고유번호증 사본 또는 원본',
            '위임공문',
            '대리인 신분증(공무원증 등)',
          ],
          [
            '사업자등록증 사본 또는 원본',
            '위임공문',
            '대리인 신분증(공무원증 등)',
          ],
        ],
      },

      notes: [
        '국세청 홈택스 컬러 출력본은 원본으로 인정',
      ],
    },
  },
  {
    content: '미군부대 신규가입 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '법인',
        organization: '미군부대',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '위임공문(부대장명의)',
            '고유번호증 사본 또는 원본',
            '대리인 신분증(미군 신분증)',
          ],
          [
            '위임공문(부대장명의)',
            '사업자등록증 사본 또는 원본',
            '대리인 신분증(미군 신분증)',
          ],
        ],
      },

      notes: [
        '국세청 홈택스 컬러 출력본은 원본으로 인정',
      ],
    },
  },
  {
    content: '미성년자 신규가입(신분증 보유) 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '미성년자',
        qualification: '신분증 보유',
      },

      documents: {
        select: 1,
        options: [
          [
            '미성년자 신분증',
            '법정대리인 가입동의서(인감날인)',
            '인감증명서',
            '법정대리인 입증서류(가족관계 확인서류 + 미성년자 기본증명서 상세 또는 특정)',
          ],
          [
            '미성년자 신분증',
            '법정대리인 가입동의서(본인서명)',
            '본인서명사실확인서',
            '법정대리인 입증서류(가족관계 확인서류 + 미성년자 기본증명서 상세 또는 특정)',
          ],
        ],
      },

      notes: [
        'SK텔레콤 전산에서 부모-자녀 관계 확인 시 법정대리인 입증서류 생략 가능',
        '18세 이상 미성년자가 대학생 또는 직장인임을 재학증명서(학생증) 또는 재직증명서로 입증 시 법정대리인 인감증명서 또는 본인서명사실확인서 제외 가능',
        '본인서명사실확인서의 위임받는 자와 대리인은 일치해야 하며, 용도란에 이동전화·유선서비스 관련 내용이 기재되어야 함',
        '미성년자 번호이동 철회 또는 신규가입 해지 후 당일 재가입 시 구비서류는 동일',
      ],
    },
  },
  {
    content: '미성년자 신규가입(법정대리인+미성년자 동반 방문) 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '미성년자',
        applicant: '법정대리인+미성년자',
      },

      documents: {
        select: 'all',
        items: [
          '법정대리인 신분증',
          '법정대리인 입증서류(가족관계 확인서류 + 미성년자 기본증명서 상세 또는 특정)',
        ],
      },

      notes: [
        'SK텔레콤 전산에서 부모-자녀 관계 확인 시 법정대리인 입증서류 생략 가능',
        '가입동의서에 법정대리인 인감도장 또는 자필서명 필요',
        '미성년자 번호이동 철회 또는 신규가입 해지 후 당일 재가입 시 구비서류는 동일',
        '대표 법정대리인이 아닌 법정대리인 방문 시 대리인 기준 구비서류 제출 필요',
      ],
    },
  },
  {
    content: '미성년자 신규가입 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '미성년자',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '법정대리인 가입동의서(인감날인)',
            '법정대리인 인감증명서',
            '위임장(인감날인)',
            '법정대리인 입증서류(가족관계 확인서류 + 미성년자 기본증명서 상세 또는 특정)',
            '대리인 신분증',
          ],
          [
            '법정대리인 본인서명사실확인서',
            '위임장(본인서명)',
            '법정대리인 가입동의서(본인서명)',
            '법정대리인 입증서류(가족관계 확인서류 + 미성년자 기본증명서 상세 또는 특정)',
            '대리인 신분증',
          ],
        ],
      },

      notes: [
        'SK텔레콤 전산에서 부모-자녀 관계 확인 시 법정대리인 입증서류 생략 가능',
        '본인서명사실확인서의 위임받는 자와 대리인은 일치해야 하며 용도란에 이동전화·유선서비스 관련 내용이 기재되어야 함',
        '미성년자 번호이동 철회 또는 신규가입 해지 후 당일 재가입 시 구비서류는 동일',
      ],
    },
  },
  {
    content: '미성년자 신규가입 법정대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '미성년자',
        applicant: '법정대리인',
      },

      documents: {
        select: 'all',
        items: [
          '법정대리인 신분증',
          '법정대리인 입증서류(가족관계 확인서류 + 미성년자 기본증명서 상세 또는 특정)',
        ],
      },

      notes: [
        'SK텔레콤 전산에서 부모-자녀 관계 확인 시 법정대리인 입증서류 생략 가능',
        '가입동의서에 법정대리인 인감도장 또는 자필서명 필요',
        '미성년자 번호이동 철회 또는 신규가입 해지 후 당일 재가입 시 구비서류는 동일',
        '대표 법정대리인이 아닌 법정대리인 방문 시 대리인 기준 구비서류 제출 필요',
      ],
    },
  },
  {
    content: '국가유공자(복지) 신규가입 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '국가유공자(복지)',
        applicant: '명의자 본인',
      },

      documents: {
        select: 1,
        options: [
          [
            '본인 신분증',
            '국가유공자 증서',
          ],
          [
            '본인 신분증',
            '국가유공자 유족증',
          ],
        ],
      },

      notes: [
        '국가유공자 유족증은 국가보훈처장 발행 또는 수권자에 한해 혜택 적용 가능',
      ],
    },
  },
  {
    content: '국가유공자(복지) 신규가입 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '국가유공자(복지)',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '명의자 인감증명서',
            '위임장(인감날인)',
            '대리인 신분증',
            '국가유공자 증서 또는 국가유공자 유족증',
          ],
          [
            '명의자 본인서명사실확인서',
            '위임장(본인서명)',
            '대리인 신분증',
            '국가유공자 증서 또는 국가유공자 유족증',
          ],
        ],
      },

      notes: [
        '국가유공자 유족증은 국가보훈처장 발행 또는 수권자에 한해 혜택 적용 가능',
      ],
    },
  },
  {
    content: '일반 신규가입 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '일반',
        applicant: '명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '명의자 본인 신분증',
        ],
      },

      notes: [],
    },
  },
  {
    content: '일반 신규가입 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '일반',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '명의자 인감증명서',
            '위임장(인감날인)',
            '대리인 신분증',
          ],
          [
            '명의자 본인서명사실확인서',
            '위임장(본인서명)',
            '대리인 신분증',
          ],
        ],
      },

      notes: [
        '본인서명사실확인서의 위임받는 자와 대리인은 일치해야 하며 용도란에 이동전화·유선서비스 관련 내용이 기재되어야 함',
      ],
    },
  },
  {
    content: '장애인(복지) 신규가입 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '장애인(복지)',
        applicant: '명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '명의자 본인 신분증',
        ],
      },

      notes: [
        '복지할인 등록을 함께 진행할 경우 전산으로 복지요금감면 자격 확인이 되지 않으면 장애인복지카드를 추가로 요청할 수 있음',
      ],
    },
  },
  {
    content: '장애인(복지) 신규가입 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '장애인(복지)',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '명의자 신분증',
            '명의자 인감증명서',
            '위임장(인감날인)',
            '대리인 신분증',
          ],
          [
            '명의자 본인서명사실확인서',
            '위임장(본인서명)',
            '대리인 신분증',
          ],
        ],
      },

      notes: [
        '복지할인 등록을 함께 진행할 경우 전산으로 복지요금감면 자격 확인이 되지 않으면 장애인복지카드를 추가로 요청할 수 있음',
      ],
    },
  },
  {
    content: '기초생활수급자 신규가입 미성년자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '기초생활수급자',
        applicant: '미성년자 본인',
      },

      documents: {
        select: 1,
        options: [
          [
            '미성년자 본인 신분증',
            '법정대리인 가입동의서(인감날인)',
            '인감증명서',
            '법정대리인 입증서류(가족관계등록부 또는 주민등록등본 등)',
          ],
          [
            '미성년자 본인 신분증',
            '법정대리인 가입동의서(본인서명)',
            '본인서명사실확인서',
            '법정대리인 입증서류(가족관계등록부 또는 주민등록등본 등)',
          ],
        ],
      },

      notes: [
        '복지요금감면 자격 확인이 되지 않을 경우 추가서류 중 택1 제출 필요',
        '추가서류 예: 수급자증명서, 국민기초생활수급자증명서, 요금감면 전화서비스 신청용 수급자증명서(국민기초생활법 제2조 제2호 기재), 자활근로자확인서(주민센터 발급)',
      ],
    },
  },
  {
    content: '기초생활수급자 신규가입 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '기초생활수급자',
        applicant: '명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '명의자 본인 신분증',
        ],
      },

      notes: [
        '복지요금감면 자격 확인이 되지 않을 경우 추가서류 중 택1 제출 필요',
        '추가서류 예: 국민기초생활수급자증명서, 요금감면 전화서비스 신청용 수급자증명서(국민기초생활법 제2조 제2호 기재), 자활근로자확인서',
      ],
    },
  },
  {
    content: '기초생활수급자 신규가입 대리인 방문 필요서류(미성년 명의)',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '기초생활수급자',
        applicant: '대리인(미성년 명의)',
      },

      documents: {
        select: 1,
        options: [
          [
            '미성년자 본인 신분증',
            '법정대리인 가입동의서(인감날인)',
            '인감증명서',
            '위임장',
            '법정대리인 입증서류(가족관계등록부 또는 주민등록등본 등)',
            '대리인 신분증',
          ],
          [
            '미성년자 본인 신분증',
            '법정대리인 가입동의서(본인서명)',
            '본인서명사실확인서',
            '위임장',
            '법정대리인 입증서류(가족관계등록부 또는 주민등록등본 등)',
            '대리인 신분증',
          ],
        ],
      },

      notes: [
        '복지요금감면 자격 확인이 되지 않을 경우 추가서류 중 택1 제출 필요',
        '추가서류 예: 수급자증명서, 국민기초생활수급자증명서, 요금감면 전화서비스 신청용 수급자증명서(국민기초생활법 제2조 제2호 기재), 자활근로자확인서',
      ],
    },
  },
  {
    content: '기초생활수급자 신규가입 미성년자 법정대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '기초생활수급자',
        applicant: '미성년자 법정대리인',
      },

      documents: {
        select: 'all',
        items: [
          '미성년자 신분증',
          '법정대리인 신분증',
          '법정대리인 가입동의서(자필서명)',
          '법정대리인 입증서류(가족관계등록부 또는 주민등록등본 등)',
        ],
      },

      notes: [
        '복지요금감면 자격 확인이 되지 않을 경우 추가서류 중 택1 제출 필요',
        '추가서류 예: 수급자증명서, 국민기초생활수급자증명서, 요금감면 전화서비스 신청용 수급자증명서(국민기초생활법 제2조 제2호 기재), 자활근로자확인서(주민센터 발급)',
      ],
    },
  },
  {
    content: '기초생활수급자 신규가입 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '기초생활수급자',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '명의자 인감증명서',
            '위임장(인감날인)',
            '대리인 신분증',
          ],
          [
            '명의자 본인서명사실확인서',
            '위임장(본인서명)',
            '대리인 신분증',
          ],
        ],
      },

      notes: [
        '복지요금감면 자격 확인이 되지 않을 경우 추가서류 중 택1 제출 필요',
        '추가서류 예: 국민기초생활수급자증명서, 요금감면 전화서비스 신청용 수급자증명서(국민기초생활법 제2조 제2호 기재), 자활근로자확인서',
      ],
    },
  },
  {
    content: '차상위계층(복지) 신규가입 미성년자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '차상위계층(복지)',
        applicant: '미성년자 본인',
      },

      documents: {
        select: 1,
        options: [
          [
            '미성년자 본인 신분증',
            '법정대리인 가입동의서(인감날인)',
            '인감증명서',
            '법정대리인 입증서류(주민등록등본)',
            '차상위자 개인정보 제공 및 조회 동의서',
          ],
          [
            '미성년자 본인 신분증',
            '법정대리인 가입동의서(본인서명)',
            '본인서명사실확인서',
            '법정대리인 입증서류(주민등록등본)',
            '차상위자 개인정보 제공 및 조회 동의서',
          ],
        ],
      },

      notes: [],
    },
  },
  {
    content: '차상위계층(복지) 신규가입 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '차상위계층(복지)',
        applicant: '명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '명의자 본인 신분증',
        ],
      },

      notes: [],
    },
  },
  {
    content: '차상위계층(복지) 신규가입 대리인 방문 필요서류(미성년 명의)',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '차상위계층(복지)',
        applicant: '대리인(미성년 명의)',
      },

      documents: {
        select: 1,
        options: [
          [
            '미성년자 본인 신분증',
            '법정대리인 가입동의서(인감날인)',
            '인감증명서',
            '위임장',
            '법정대리인 입증서류(주민등록등본)',
            '대리인 신분증',
            '차상위자 개인정보 제공 및 조회 동의서',
          ],
          [
            '미성년자 본인 신분증',
            '법정대리인 가입동의서(본인서명)',
            '본인서명사실확인서',
            '위임장',
            '법정대리인 입증서류(주민등록등본)',
            '대리인 신분증',
            '차상위자 개인정보 제공 및 조회 동의서',
          ],
        ],
      },

      notes: [],
    },
  },
  {
    content: '차상위계층(복지) 신규가입 미성년자 법정대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '차상위계층(복지)',
        applicant: '미성년자 법정대리인',
      },

      documents: {
        select: 'all',
        items: [
          '미성년자 본인 신분증',
          '법정대리인 신분증',
          '법정대리인 가입동의서(자필서명)',
          '법정대리인 입증서류(주민등록등본)',
          '차상위자 개인정보 제공 및 조회 동의서',
        ],
      },

      notes: [],
    },
  },
  {
    content: '차상위계층(복지) 신규가입 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '차상위계층(복지)',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '명의자 인감증명서',
            '위임장(인감날인)',
            '차상위자 개인정보 제공 및 조회 동의서',
            '대리인 신분증',
            '가족관계 확인서류(가족관계등록부 또는 주민등록등본 등)',
          ],
          [
            '명의자 본인서명사실확인서',
            '위임장(본인서명)',
            '차상위자 개인정보 제공 및 조회 동의서',
            '대리인 신분증',
            '가족관계 확인서류(가족관계등록부 또는 주민등록등본 등)',
          ],
        ],
      },

      notes: [],
    },
  },
  {
    content: '외국인 신규가입 개인 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '개인',
        applicant: '명의자 본인',
      },

      documents: {
        select: 1,
        options: [
          [
            '외국인등록증',
          ],
          [
            '외국국적 동포 국내거소신고증',
          ],
        ],
      },

      notes: [],
    },
  },
  {
    content: '외국인 신규가입 개인 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '개인',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '명의자 외국인등록증',
            '대리인 신분증',
          ],
          [
            '외국국적 동포 국내거소신고증',
            '대리인 신분증',
          ],
        ],
      },

      notes: [],
    },
  }
]

async function seedKnowledgeBase() {
  console.log('Starting knowledge base seeding...')

  for (const doc of knowledgeDocuments) {
    try {
      console.log(`Processing: ${doc.content.substring(0, 50)}...`)

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: doc.content,
      })

      const embedding = embeddingResponse.data[0].embedding

      const { error } = await supabase.from('knowledge_base').insert({
        content: doc.content,
        embedding: embedding,
        document_type: doc.document_type,
        metadata: doc.metadata,
      })

      if (error) {
        console.error('Error inserting document:', error)
      } else {
        console.log('✓ Document inserted successfully')
      }
    } catch (error) {
      console.error('Error processing document:', error)
    }
  }

  console.log('Knowledge base seeding completed!')
}

seedKnowledgeBase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
