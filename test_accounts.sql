-- 테스트 계정 생성
DELETE FROM profiles WHERE full_name IN ('테스트고객', '테스트직원');

INSERT INTO profiles (full_name, username, phone_number, role)
VALUES 
  ('테스트고객', '1234', '010-1111-1111', 'customer'),
  ('테스트직원', 'admin', '010-9999-9999', 'agency_staff');

SELECT full_name, username, role FROM profiles WHERE full_name IN ('테스트고객', '테스트직원');
