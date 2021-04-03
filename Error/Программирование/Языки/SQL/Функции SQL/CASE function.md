В case function аргументы после слова THEN должны иметь одинаковый тип.  
## Simple 
**Шаблон:**
```sql
CASE expr
WHEN comp1 THEN ifture1
WHEN comp2 THEN ifture2
...
WHEN compN THEN iftureN
ELSE iffalse
END
```

## Searched
**Шаблон:**
```sql
CASE
WHEN expr1=comp1 THEN ifture1
WHEN expr2>comp2 THEN ifture2
...
WHEN exprn like 'compN' THEN iftureN
ELSE iffalse
END
```

## Examples
```sql
select CASE 3 * 4  
 When 10 Then 100  
 When 12 * 1 Then 200  
 When null Then 300  
 END  
 from DUAL;  
  
select CASE 3 * 4  
 When 10 Then 'Ten'  
 When 12 Then 'Hello, world!'  
 When null Then '300'  
 ELSE 'million'  
 END  
 from DUAL;
 
select CASE  
 When 10 \= 4 Then 100  
 When 12 \* 1 \= 12 Then 200  
 When 'ok' like 'o%' Then 300  
 ELSE 1000  
 END as MY\_TABLE  
    from DUAL;
```
---
*теги:* #базы_данных #sql/function/single-row/conditional 