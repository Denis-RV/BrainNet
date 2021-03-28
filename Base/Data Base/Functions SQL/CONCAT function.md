-  ==CONCAT(s,s)== - функция конкатенации.

***Примеры:***
```sql
SELECT CONCAT('privet, ', salary*2) from dual;

--эквивалент:

select 'privet, ' || salary*2 from dual;
```
---
*tegs:* #db, #sql, #sqlFunction #character_func #single-row_func 