==DECODE(expr, comp1, iftrue1, comp2, iftrue2, ..., compN, iftrueN, iffalse)== - если 2 параметр равен 1, выводим 3 параметр. Иначе если 5 параметр равен 1, выводим 6 параметр. Если ничего не равно 1 параметру, возвращаем iffalse.

***Примеры:***
```sql
select DECODE(3 \* 4, 12, 'twelve') from DUAL; \--twelve  
select DECODE(3 \* 4 \* 3, 12, 'twelve', 36, 'thirty six') from DUAL; \--thirty six  
select DECODE(3 \* 3, 12, 'twelve', 36, 'thirty six', 'not found') from DUAL; \--not found  
select DECODE(null, 5, 'ok', null, 44) from dual;
```
---
*tegs:* #database, #sql, #sqlFunction #conditional_func #single-row_func #oracle_db