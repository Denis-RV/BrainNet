Аналог [[INSTR function]], но с возможностью применения регулярных выражений ([[$ Regex введение]]).

***Примеры:***
```sql
SQL> select FIRST_NAME, PHONE_NUMBER from EMPLOYEES
  2  where REGEXP_INSTR(PHONE_NUMBER, '\d{3}\.\d{2}\.\d{4}\.\d{6}') != 0;

FIRST_NAME           PHONE_NUMBER
-------------------- --------------------
John                 011.44.1344.429268
Karen                011.44.1344.467268
Alberto              011.44.1344.429278
```
---
*теги:* #базы_данных, #sql/function/single-row/character  #регулярка 