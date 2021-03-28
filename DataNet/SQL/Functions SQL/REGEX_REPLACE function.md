Аналог [[SUBSTR function]], но с возможностью применения регулярных выражений ([[$ Regex intro]]).

***Примеры:***
```sql
SQL> select REGEXP_REPLACE('file.txt, dir, note.txt, go.t, txt.h, txt, m''di.txt', '(\w*\.txt)') Go from dual;

GO
-----------------------------
, dir, , go.t, txt.h, txt, m'
```
---
*tegs:* #db, #sql, #sqlFunction #character_func #single-row_func 