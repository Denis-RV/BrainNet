==TRIM== - удаляет символ с начала (leading), или с конца (trailing), или с начала и конца (both)

	**Шаблон:**
	>TRIM({trailing | leading | both} trimstring from s)
	
	trimstring - текст, который надо срезать, s - откуда срезать.

***Примеры:***
```sql
SQL> select TRIM(trailing 'q' from 'Zaurqqqq') from dual;

TRIM
----
Zaur
```

both можно не писать:
```sql
select TRIM(both '*' from '***Zaur**qqqq***') from dual;
--Эквивалент
select TRIM('*' from '***Zaur**qqqq***') from dual;
```
---
*tegs:* #db, #sql, #sqlFunction #character_func #single-row_func 