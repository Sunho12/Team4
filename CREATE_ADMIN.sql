-- 대리점 직원 계정 생성
-- Supabase Dashboard SQL Editor에서 실행

-- 예시 1: 대리점 직원 계정
INSERT INTO profiles (full_name, username, phone_number, role)
VALUES ('대리점직원', 'admin', '010-9999-9999', 'agency_staff');

-- 예시 2: 관리자 계정
INSERT INTO profiles (full_name, username, phone_number, role)
VALUES ('관리자', 'admin123', '010-0000-0000', 'admin');

-- 확인
SELECT id, full_name, username, phone_number, role, created_at
FROM profiles
WHERE role IN ('admin', 'agency_staff')
ORDER BY created_at DESC;

-- 사용법:
-- 1. 위 SQL을 Supabase에서 실행
-- 2. 로그인:
--    - 이름: 대리점직원
--    - 비밀번호: admin
-- 3. /search 페이지 접근 가능!
