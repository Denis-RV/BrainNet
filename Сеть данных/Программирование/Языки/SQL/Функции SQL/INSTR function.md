==INSTR(s, search string, `start position, Nth occurrence`)==

search string - искомый текст, start position - позиция для начала работы (по умолчанию = 1), Nth occurrence - N-ое появление (по умолчанию = 1)

***Примеры:***
```sql
SQL> select first_name, job_id from employees
2  where INSTR(job_id, UPPER('prog')) = 4;
FIRST_NAME           JOB_ID
-------------------- ----------
David                IT_PROG
Bruce                IT_PROG
```

Поиск символа:
```sql
SQL> select INSTR('Zaur Tr...', 'r') from dual;

INSTR('ZAURTR...','R')
----------------------
					 4

SQL> select INSTR('Zaur Tr...', 'r', 1, 2) from dual;

INSTR('ZAURTR...','R',1,2)
--------------------------
						 7
```
---
*tags:* #database, #sql, #sqlFunction #character_func #single-row_func 