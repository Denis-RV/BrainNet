Аналог [[SUBSTR function]], но с возможностью применения регулярных выражений ([[$ Regex syntax]]).

***Примеры:***
```sql
SQL> select REGEXP_REPLACE('file.txt, dir, note.txt, go.t, txt.h, txt, m''di.txt', '(\w*\.txt)') Go from dual;

GO
-----------------------------
, dir, , go.t, txt.h, txt, m'
```
---
*теги:* #database, #sql, #sqlFunction #character_func #single-row_func 