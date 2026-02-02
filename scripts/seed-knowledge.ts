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
  },
  {
    content: '외국인 신규가입 외교관 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '외교관',
        applicant: '명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '명의자 본인 여권',
          '외교관 신분증',
        ],
      },

      notes: [],
    },
  },
  {
    content: '외국인 신규가입 외교관 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '외교관',
        applicant: '대리인',
      },

      documents: {
        select: 'all',
        items: [
          '명의자 본인 여권',
          '외교관 신분증',
          '대리인 신분증',
        ],
      },

      notes: [],
    },
  },
  {
    content: '외국인 신규가입 재외동포 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '재외동포',
        applicant: '명의자 본인',
      },

      documents: {
        select: 1,
        options: [
          [
            '외국인등록증(체류기간 내 이용 가능)',
          ],
          [
            '주민등록증',
          ],
        ],
      },

      notes: [],
    },
  },
  {
    content: '외국인 신규가입 재외동포 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '재외동포',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '외국인등록증(체류기간 내 이용 가능)',
            '대리인 신분증',
          ],
          [
            '주민등록증',
            '대리인 신분증',
          ],
        ],
      },

      notes: [],
    },
  },
  {
    content: '외국인 신규가입 영주권자 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '영주권자',
        applicant: '명의자 본인',
      },

      documents: {
        select: 1,
        options: [
          [
            '외국인등록증',
          ],
          [
            '영주증(영주자격 F-5)',
          ],
        ],
      },

      notes: [],
    },
  },
  {
    content: '외국인 신규가입 영주권자 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '영주권자',
        applicant: '대리인',
      },

      documents: {
        select: 'all',
        items: [
          '명의자 신분증',
          '대리인 신분증',
        ],
      },

      notes: [],
    },
  },
  {
    content: '외국인 신규가입 외국인 미성년자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '외국인 미성년자',
        applicant: '미성년자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '미성년자 외국인등록증 또는 외국국적 동포 국내거소신고증',
          '가입동의서',
          '법정대리인 인감증명서 또는 법정대리인 본인서명사실확인서',
          '가족관계 확인 서류(외국인등록사실증명원 또는 국내거소사실증명원 또는 건강보험증)',
        ],
      },

      notes: [],
    },
  },
  {
    content: '외국인 신규가입 외국인 미성년자 법정대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '외국인 미성년자',
        applicant: '법정대리인',
      },

      documents: {
        select: 'all',
        items: [
          '법정대리인 외국인등록증 또는 외국국적 동포 국내거소신고증',
          '가입동의서',
          '미성년자 외국인 신분증',
          '가족관계 확인 서류(외국인등록사실증명원 또는 국내거소사실증명원 또는 건강보험증)',
        ],
      },

      notes: [],
    },
  },
  {
    content: '외국인 신규가입 주한미군 명의자 본인 처리 안내',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '주한미군',
        applicant: '명의자 본인',
      },

      status: 'suspended',

      documents: {
        select: 'none',
        items: [],
      },

      notes: [
        '주한미군 신규가입 정책이 현재 중단되어 접수 불가',
      ],
    },
  },
  {
    content: '외국인 신규가입 주한미군 대리인 처리 안내',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '신규가입',
        customer: '외국인',
        category: '주한미군',
        applicant: '대리인',
      },

      status: 'suspended',

      documents: {
        select: 'none',
        items: [],
      },

      notes: [
        '주한미군 신규가입 정책이 현재 중단되어 접수 불가',
      ],
    },
  },
  {
    content: '이동통신 3사 동시 가입 제한 신청(개인) 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '이동통신 3사 동시 가입 제한',
        customer: '개인',
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
    content: '이동통신 3사 동시 가입 제한 신청(개인) 한정후견인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '이동통신 3사 동시 가입 제한',
        customer: '개인',
        applicant: '한정후견인',
      },

      documents: {
        select: 'all',
        items: [
          '법원판결문',
          '한정후견인 신분증',
        ],
      },

      notes: [],
    },
  },
  {
    content: '이동통신 3사 동시 가입 제한 신청(개인) 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '이동통신 3사 동시 가입 제한',
        customer: '개인',
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
        '이동통신 3사 동시 가입 제한 해제는 대리인 신청 불가',
      ],
    },
  },
  {
    content: '이동통신 3사 동시 가입 제한 신청(미성년자) 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '이동통신 3사 동시 가입 제한',
        customer: '미성년자',
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
    content: '이동통신 3사 동시 가입 제한 신청(미성년자) 대리인 처리 안내',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '이동통신 3사 동시 가입 제한',
        customer: '미성년자',
        applicant: '대리인',
      },

      status: 'not_allowed',

      documents: {
        select: 'none',
        items: [],
      },

      notes: [
        '미성년자 이동통신 3사 동시 가입 제한 신청은 대리인으로 처리 불가',
      ],
    },
  },
  {
    content: '이동통신 3사 동시 가입 제한 신청(미성년자) 법정대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '이동통신 3사 동시 가입 제한',
        customer: '미성년자',
        applicant: '법정대리인',
      },

      documents: {
        select: 'all',
        items: [
          '미성년자 신분증',
          '법정대리인 입증서류(가족관계증명서 또는 주민등록등본 등)',
          '법정대리인 신분증',
        ],
      },

      notes: [],
    },
  },{
    content: '이동통신 3사 동시 가입 제한 신청(외국인) 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '이동통신 3사 동시 가입 제한',
        customer: '외국인',
        applicant: '명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '외국인등록증',
          '주민등록증(재외동포)',
          '외국국적동포 국내거소증',
        ],
      },

      notes: [],
    },
  },
  {
    content: '이동통신 3사 동시 가입 제한 해제(가입 당일) 개인 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '이동통신 3사 동시 가입 제한 해제(가입 당일)',
        customer: '개인',
        applicant: '명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '외국인등록증',
          '주민등록증(재외동포)',
          '외국국적동포 국내거소증',
        ],
      },

      notes: [],
    },
  },
  {
    content: '이동통신 3사 동시 가입 제한 해제(가입 당일) 개인 한정후견인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '이동통신 3사 동시 가입 제한 해제(가입 당일)',
        customer: '개인',
        applicant: '한정후견인',
      },

      documents: {
        select: 'all',
        items: [
          '한정후견인 신분증',
        ],
      },

      notes: [
        '한정후견인 요청으로 등록된 가입 제한 건은 명의자 요청으로 해제 불가',
      ],
    },
  },
  {
    content: '이동통신 3사 동시 가입 제한 해제(가입 당일) 미성년자 명의자 본인 처리 안내',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '가입',
        type: '이동통신 3사 동시 가입 제한 해제(가입 당일)',
        customer: '미성년자',
        applicant: '명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '한정후견인 신분증',
        ],
      },

      notes: [
        '한정후견인 요청으로 등록된 가입 제한 건은 명의자 요청으로 해제 불가',
      ],
    },
  },
  {
    content: 'T멤버십 신청 명의자 본인 방문 필요서류',
    document_type: 'membership_procedure',
    metadata: {
      path: {
        service: 'T멤버십',
        type: '멤버십 신청',
        customer: '멤버십 명의자',
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
    content: 'T멤버십 신청 멤버십 명의자 대리인 방문 필요서류',
    document_type: 'membership_procedure',
    metadata: {
      path: {
        service: 'T멤버십',
        type: '멤버십 신청',
        customer: '멤버십 명의자',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          {
            condition: '성인',
            items: [
              '명의자 본인 신분증',
              '대리인 본인 신분증',
              '명의자와 전화통화',
            ],
          },
          {
            condition: '만 14세 이상 미성년자(신분증 보유)',
            items: [
              '미성년자 본인 신분증',
              '대리인 본인 신분증',
              '명의자와 전화통화',
            ],
          },
          {
            condition: '만 14세 이상 미성년자(신분증 미보유)',
            items: [
              '법정대리인 본인 신분증',
              '법정대리인 입증서류(가족관계등록부 또는 주민등록등본 등)',
              '대리인 본인 신분증',
              '법정대리인과 전화통화',
            ],
          },
          {
            condition: '만 14세 미만 미성년자',
            items: [
              '법정대리인 본인 신분증',
              '법정대리인 입증서류(가족관계등록부 또는 주민등록등본 등)',
              '대리인 본인 신분증',
              '법정대리인과 전화통화',
            ],
          },
        ],
      },

      notes: [],
    },
  },
  {
    content: 'T멤버십 변경/해지 개인 명의자 본인 방문 필요서류',
    document_type: 'membership_procedure',
    metadata: {
      path: {
        service: 'T멤버십',
        type: '멤버십 변경/해지',
        customer: '개인',
        applicant: '명의자 본인',
      },

      documents: {
        select: 1,
        options: [
          {
            condition: '이동전화 명의자 = 멤버십 명의자',
            items: [
              '이동전화 명의자 본인 신분증',
            ],
          },
          {
            condition: '이동전화 명의자 ≠ 멤버십 명의자',
            items: [
              '이동전화 명의자 신분증',
              '멤버십 명의자 신분증',
            ],
          },
        ],
      },

      notes: [],
    },
  },
  {
    content: 'T멤버십 정보 확인(가입여부/상태/등급) 개인 명의자 본인 방문 필요서류',
    document_type: 'membership_procedure',
    metadata: {
      path: {
        service: 'T멤버십',
        type: '멤버십 정보 확인',
        customer: '개인',
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
    content: '요금제 변경 개인 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '요금제/부가서비스/약정',
        type: '요금제 변경',
        customer: '개인',
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
    content: '요금제 변경 개인 대리인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '요금제/부가서비스/약정',
        type: '요금제 변경',
        customer: '개인',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          {
            condition: '명의자 성인',
            items: [
              '명의자 신분증',
              '대리인 신분증',
            ],
          },
          {
            condition: '명의자 미성년자(동의서)',
            items: [
              '미성년자 신분증',
              '법정대리인 신분증',
              '가족관계 확인서류(가족관계등록부 또는 주민등록등본 등)',
              '법정대리인 동의서',
              '대리인 신분증',
            ],
          },
          {
            condition: '명의자 미성년자(법정대리인 통화)',
            items: [
              '미성년자 신분증',
              '법정대리인 신분증',
              '가족관계 확인서류(가족관계등록부 또는 주민등록등본 등)',
              '법정대리인과 통화',
              '대리인 신분증',
            ],
          },
        ],
      },

      notes: [],
    },
  },
  {
    content: '가족그룹 등록 및 가족추가 개인(성인) 대표회선 명의자 본인 방문 필요서류',
    document_type: 'subscription_procedure',
    metadata: {
      path: {
        service: '요금제/부가서비스/약정',
        type: '가족그룹 등록 및 가족추가',
        customer: '개인(성인)',
        applicant: '대표회선 명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '대표회선 명의자 본인 신분증',
          'SKT 대표회선과의 가족관계 입증서류',
        ],
      },

      notes: [
        '가족관계 입증서류에는 가족 주민등록번호 앞 6자리가 포함되어야 함',
        '가족관계 입증서류는 원본 또는 사본 제출 가능',
      ],
    },
  },
  {
    content: 'SMS/MMS 발신자 확인 개인 명의자 본인 방문 필요서류',
    document_type: 'inquiry_procedure',
    metadata: {
      path: {
        service: '열람/조회',
        type: 'SMS/MMS 발신자 확인',
        customer: '개인',
        applicant: '명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '본인 신분증',
          '업무 처리할 휴대폰(SMS/MMS 문자 내용이 저장된 단말기)',
        ],
      },

      notes: [
        '폭언·협박·희롱 등 불법 또는 위협적 내용에 한해서만 발신자 확인 가능',
        '문자 수신 후 6일 이내(D+5일) 방문해야 처리 가능',
        'SMS/MMS가 저장된 단말기를 반드시 지참해야 하며 문자 삭제 시 처리 불가',
        '전화 협박의 경우에도 동일 조건(6일 이내, 단말기 지참)에 한해 발신번호 확인 가능',
      ],
    },
  },
  {
    content: '통화내역(일반) 열람 개인 명의자 본인 방문 필요서류',
    document_type: 'inquiry_procedure',
    metadata: {
      path: {
        service: '열람/조회',
        type: '통화내역(일반) 열람',
        customer: '개인',
        applicant: '명의자 본인',
      },

      documents: {
        select: 'all',
        items: [
          '명의자 본인 신분증',
          '업무 처리할 휴대폰(SMS 인증 필요)',
        ],
      },

      notes: [
        '통화내역 열람은 발신 통화내역(전화를 건 내역)만 가능하며 수신 통화내역은 열람 불가',
        '해외 로밍 이용 시에는 수신·발신 통화내역 모두 열람 가능',
      ],
    },
  },
  {
    content: '일시정지 신청/해제(발신금지·착신금지) 개인 명의자 본인 방문 필요서류',
    document_type: 'suspension_procedure',
    metadata: {
      path: {
        service: '정지/해제',
        type: '일시정지 신청·해제(발신금지/착신금지)',
        customer: '개인',
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
    content: '분실정지 신청/습득정지 해제 개인 명의자 본인 방문 필요서류',
    document_type: 'suspension_procedure',
    metadata: {
      path: {
        service: '정지/해제',
        type: '분실정지 신청·습득정지 해제',
        customer: '개인',
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
    content: '일반해지 개인 명의자 본인 방문 필요서류',
    document_type: 'termination_procedure',
    metadata: {
      path: {
        service: '해지',
        type: '일반해지',
        customer: '개인',
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
    content: '일반해지 개인 대리인 방문 필요서류',
    document_type: 'termination_procedure',
    metadata: {
      path: {
        service: '해지',
        type: '일반해지',
        customer: '개인',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          {
            condition: '전화로 명의자 해지 의사 확인 가능',
            items: [
              '명의자 본인 신분증',
              '대리인 본인 신분증',
            ],
          },
          {
            condition: '전화로 명의자 해지 의사 확인 불가(인감)',
            items: [
              '명의자 인감증명서',
              '위임장(인감날인)',
              '대리인 신분증',
            ],
          },
          {
            condition: '전화로 명의자 해지 의사 확인 불가(본인서명)',
            items: [
              '명의자 본인서명사실확인서',
              '위임장(본인서명)',
              '대리인 본인 신분증',
            ],
          },
        ],
      },

      notes: [],
    },
  },
  {
    content: '일반해지 법인 대표자 방문 필요서류',
    document_type: 'termination_procedure',
    metadata: {
      path: {
        service: '해지',
        type: '일반해지',
        customer: '법인',
        applicant: '대표자',
      },

      documents: {
        select: 1,
        options: [
          {
            condition: '단독대표(고유번호증)',
            items: [
              '고유번호증 사본',
              '대표자 신분증',
            ],
          },
          {
            condition: '단독대표(사업자등록증)',
            items: [
              '사업자등록증 사본',
              '대표자 신분증',
            ],
          },
          {
            condition: '단독대표(등기사항전부증명서 현재사항)',
            items: [
              '등기사항전부증명서(현재사항) 사본',
              '대표자 신분증',
            ],
          },
          {
            condition: '공동대표 중 1인 방문(고유번호증)',
            items: [
              '고유번호증 사본',
              '대표자 신분증',
              '나머지 대표자 인감증명서',
              '나머지 대표자 위임장',
            ],
          },
          {
            condition: '공동대표 중 1인 방문(사업자등록증)',
            items: [
              '사업자등록증 사본',
              '대표자 신분증',
              '나머지 대표자 인감증명서',
              '나머지 대표자 위임장',
            ],
          },
          {
            condition: '공동대표 중 1인 방문(등기사항전부증명서 현재사항)',
            items: [
              '등기사항전부증명서(현재사항) 사본',
              '대표자 신분증',
              '나머지 대표자 인감증명서',
              '나머지 대표자 위임장',
            ],
          },
        ],
      },

      notes: [
        '국세청 홈택스 컬러 출력본은 원본으로 인정',
      ],
    },
  },
  {
    content: '일반해지 법인 대리인 방문 필요서류',
    document_type: 'termination_procedure',
    metadata: {
      path: {
        service: '해지',
        type: '일반해지',
        customer: '법인',
        applicant: '대리인',
      },

      documents: {
        select: 1,
        options: [
          [
            '법인 인감증명서',
            '위임장(법인인감 날인)',
            '사업자등록증 사본',
            '대리인 본인 신분증',
          ],
          [
            '법인 위임공문(대표자 또는 기관장 명의)',
            '사업자등록증 사본',
            '대리인 본인 신분증',
          ],
        ],
      },

      notes: [
        '국세청 홈택스에서 컬러로 출력한 파일은 원본으로 인정',
      ],
    },
  },
  {
    content: '5GX 플래티넘(T 우주) 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '5GX 플래티넘(T 우주)',
      price: 125000,
      data: '무제한',
      voice: '무제한',
      sms: '기본 제공',
      benefits: ['T 우주패스', 'T 멤버십 VIP', '스마트기기 2회선 무료'],
    },
  },
  {
    content: '5GX 플래티넘(T 우주) 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '5GX 플래티넘(T 우주)',
      price: 125000,
      data: '무제한',
      voice: '무제한',
      sms: '기본 제공',
      benefits: ['T 우주패스', 'T 멤버십 VIP', '스마트기기 2회선 무료'],
    },
  },
  {
    content: '5GX 프리미엄(T 우주) 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '5GX 프리미엄(T 우주)',
      price: 109000,
      data: '무제한',
      voice: '무제한',
      sms: '기본 제공',
      benefits: ['T 우주패스', 'T 멤버십 VIP', '스마트기기 1회선 무료'],
    },
  },
  {
    content: '0 청년 109(넷플릭스) 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '0 청년 109(넷플릭스)',
      price: 109000,
      data: '120GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: ['커피/영화/로밍 50% 할인', 'T 멤버십 VIP'],
    },
  },
  {
    content: '0 청년 99(넷플릭스) 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '0 청년 99(넷플릭스)',
      price: 99000,
      data: '100GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: ['커피/영화/로밍 50% 할인', 'T 멤버십 VIP'],
    },
  },
  {
    content: '0 청년 다이렉트 69(T 우주) 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '0 청년 다이렉트 69(T 우주)',
      price: 69000,
      data: '100GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: ['T 우주패스', 'T 멤버십 VIP'],
    },
  },
  {
    content: '0 청년 다이렉트 62(T 우주) 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '0 청년 다이렉트 62(T 우주)',
      price: 62000,
      data: '80GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: ['T 우주패스', 'T 멤버십 VIP'],
    },
  },
  {
    content: '다이렉트5G 76(T 우주) 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '다이렉트5G 76(T 우주)',
      price: 76000,
      data: '100GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: ['T 우주패스', 'T 멤버십'],
    },
  },
  {
    content: '다이렉트5G 69(넷플릭스) 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '다이렉트5G 69(넷플릭스)',
      price: 69000,
      data: '80GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: ['T 우주패스', 'T 멤버십'],
    },
  },
  {
    content: '다이렉트5G 62 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '다이렉트5G 62',
      price: 62000,
      data: '60GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: ['T 멤버십'],
    },
  },
  {
    content: '5G 행복누리 레귤러 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '5G 행복누리 레귤러',
      price: 69000,
      data: '110GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: [],
    },
  },
  {
    content: '5G 행복누리 슬림 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '5G 행복누리 슬림',
      price: 55000,
      data: '11GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: [],
    },
  },
  {
    content: '5G ZEM플랜 퍼펙트 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '5G ZEM플랜 퍼펙트',
      price: 36000,
      data: '6GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: [],
    },
  },
  {
    content: 'ZEM플랜 베스트 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: 'ZEM플랜 베스트',
      price: 26000,
      data: '3GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: [],
    },
  },
  {
    content: '0틴 5G 요금제',
    document_type: 'plan_info',
    metadata: {
      plan_name: '0틴 5G',
      price: 45000,
      data: '9GB',
      voice: '무제한',
      sms: '기본 제공',
      benefits: [],
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
