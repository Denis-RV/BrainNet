-  ==CONCAT(s,s)== - функция конкатенации.

***Примеры:***
```sql
SELECT CONCAT('privet, ', salary*2) from dual;

--эквивалент:

select 'privet, ' || salary*2 from dual;
```
---
*теги:* #базы_данных, #sql/function/single-row/character