# 완전한 테스트 가이드

## 🔧 준비 단계

### 1. 마이그레이션 실행 (아직 안 했다면)
```
Supabase Dashboard에서 COMPLETE_MIGRATION.sql 실행
```

### 2. 테스트 계정 생성
```sql
-- Supabase Dashboard SQL Editor에서 실행

-- 기존 테스트 계정 삭제
DELETE FROM profiles WHERE full_name IN ('테스트고객', '테스트직원');

-- 새 테스트 계정 생성
INSERT INTO profiles (full_name, username, phone_number, role)
VALUES
  ('테스트고객', '1234', '010-1111-1111', 'customer'),
  ('테스트직원', 'admin', '010-9999-9999', 'agency_staff');

-- 확인
SELECT full_name, username, role FROM profiles
WHERE full_name IN ('테스트고객', '테스트직원');
```

### 3. 서버 시작
```bash
cd tworld-chatbot
npm run dev
```

---

## ✅ 테스트 시나리오

### 시나리오 1: 고객이 챗봇 접근
```
목표: 고객은 챗봇만 사용 가능

1. 브라우저 시크릿 모드 열기
2. http://localhost:3000/chat 접속
3. 자동으로 로그인 페이지로 리다이렉트
   ✅ URL 확인: /auth/login?returnUrl=/chat
4. 로그인:
   - 이름: 테스트고객
   - 비밀번호: 1234
5. 로그인 클릭
6. ✅ /chat으로 자동 이동
7. ✅ 헤더에 "테스트고객" 표시
8. ✅ 메시지 전송 가능
```

### 시나리오 2: 고객이 대리점 접근 시도 (권한 없음)
```
목표: 고객은 대리점 페이지 접근 불가

1. 같은 브라우저에서 (로그인 유지)
2. http://localhost:3000/search 접속
3. ✅ 팝업 표시: "권한이 없습니다. 대리점 직원만 접근할 수 있습니다."
4. ✅ 팝업 확인 후 /chat으로 강제 이동
```

### 시나리오 3: 대리점 직원이 대리점 접근
```
목표: 대리점 직원은 대리점 페이지 사용 가능

1. 새 시크릿 모드 열기
2. http://localhost:3000/search 접속
3. 자동으로 로그인 페이지로 리다이렉트
   ✅ URL 확인: /auth/login?returnUrl=/search
4. 로그인:
   - 이름: 테스트직원
   - 비밀번호: admin
5. 로그인 클릭
6. ✅ /search로 자동 이동
7. ✅ 검색 기능 사용 가능
```

### 시나리오 4: 대리점 직원이 챗봇 사용
```
목표: 대리점 직원도 챗봇 사용 가능

1. 같은 브라우저에서 (직원 로그인 유지)
2. http://localhost:3000/chat 접속
3. ✅ 바로 챗봇 페이지 표시
4. ✅ 메시지 전송 가능
```

### 시나리오 5: 고객 상세 페이지 권한 체크
```
목표: 대리점 직원만 접근 가능

A. 고객으로 접근 시도:
1. 시나리오 1의 브라우저 (고객 로그인)
2. http://localhost:3000/customers/아무UUID 접속
3. ✅ 팝업: "권한이 없습니다"
4. ✅ /chat으로 이동

B. 직원으로 접근:
1. 시나리오 3의 브라우저 (직원 로그인)
2. /search에서 고객 검색
3. 고객 클릭하여 상세 페이지 접속
4. ✅ 고객 정보 표시
5. ✅ 구매 예측 분석 가능
```

---

## 🎯 체크리스트

### 고객 권한
- [ ] 챗봇 접근 가능
- [ ] 대리점 페이지 접근 차단
- [ ] 차단 시 팝업 표시
- [ ] 자동으로 /chat으로 리다이렉트

### 대리점 직원 권한
- [ ] 대리점 페이지 접근 가능
- [ ] 챗봇도 사용 가능
- [ ] 고객 검색 가능
- [ ] 고객 상세 정보 확인 가능

### 로그인 플로우
- [ ] returnUrl 파라미터 전달
- [ ] 로그인 후 원래 페이지로 복귀
- [ ] role에 따라 권한 체크
- [ ] 권한 없으면 적절한 페이지로 리다이렉트

---

## 🐛 문제 발생 시

### "권한이 없습니다" 팝업이 안 뜨는 경우
```
→ 브라우저 콘솔 확인
→ role이 제대로 반환되는지 확인
→ /api/auth/me 응답 확인
```

### 로그인 후 엉뚱한 페이지로 가는 경우
```
→ URL의 returnUrl 파라미터 확인
→ 로그인 페이지 코드에서 returnUrl 처리 확인
```

### role이 제대로 안 나오는 경우
```sql
-- Supabase에서 확인
SELECT id, full_name, role FROM profiles;

-- role 업데이트
UPDATE profiles SET role = 'customer' WHERE full_name = '테스트고객';
UPDATE profiles SET role = 'agency_staff' WHERE full_name = '테스트직원';
```

---

## 📊 예상 결과

### 모든 시나리오 통과 시:
```
✅ 고객은 챗봇만 사용
✅ 직원은 대리점 + 챗봇 모두 사용
✅ 권한 없으면 팝업 + 리다이렉트
✅ returnUrl로 원래 페이지로 복귀
✅ 단일 로그인 페이지로 통합
```

---

## 🚀 완료!

모든 시나리오가 통과하면 완벽하게 작동하는 것입니다!
